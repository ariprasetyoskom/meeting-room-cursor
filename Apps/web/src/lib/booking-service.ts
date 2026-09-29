import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bookings, rooms, users } from "@/db/schema";
import {
  assertBookingWindow,
  assertCanCancel,
  PolicyError,
} from "./booking-policy";
import type { CreateBookingInput } from "./validators/booking";
import type { SessionUser } from "./auth/session";
type PostgresError = Error & { code?: string };

export async function listBookings(params: {
  roomId?: string;
  from?: Date;
  to?: Date;
  organizerUserId?: string;
}) {
  const conditions = [eq(bookings.status, "confirmed")];
  if (params.roomId) conditions.push(eq(bookings.roomId, params.roomId));
  if (params.organizerUserId) {
    conditions.push(eq(bookings.organizerUserId, params.organizerUserId));
  }
  if (params.from) conditions.push(gte(bookings.startAt, params.from));
  if (params.to) conditions.push(lte(bookings.endAt, params.to));

  const rows = await db
    .select({
      id: bookings.id,
      roomId: bookings.roomId,
      title: bookings.title,
      description: bookings.description,
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      status: bookings.status,
      organizerUserId: bookings.organizerUserId,
      organizerName: users.displayName,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.organizerUserId, users.id))
    .where(and(...conditions))
    .orderBy(asc(bookings.startAt));

  return rows;
}

export async function createBooking(
  input: CreateBookingInput,
  actor: SessionUser,
) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  assertBookingWindow(startAt, endAt);

  const roomRows = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, input.roomId), eq(rooms.isActive, true)))
    .limit(1);
  const room = roomRows[0];
  if (!room) {
    throw new PolicyError(
      "ROOM_NOT_FOUND",
      "Ruangan tidak ditemukan atau tidak aktif.",
      "Room not found or inactive.",
    );
  }

  try {
    const [created] = await db
      .insert(bookings)
      .values({
        roomId: input.roomId,
        organizerUserId: actor.id,
        title: input.title,
        description: input.description,
        startAt,
        endAt,
        status: "confirmed",
      })
      .returning();

    await db.insert(auditLogs).values({
      actorUserId: actor.id,
      entityType: "booking",
      entityId: created.id,
      action: "BOOKING_CREATED",
      payload: { roomId: input.roomId, startAt, endAt },
    });

    if (process.env.REDIS_URL) {
      const { enqueueBookingConfirmEmail } = await import(
        "./queue/email-queue"
      );
      await enqueueBookingConfirmEmail(created.id);
    }

    return created;
  } catch (err) {
    const pg = err as PostgresError;
    if (pg.code === "23P01") {
      const conflicts = await listBookings({
        roomId: input.roomId,
        from: startAt,
        to: endAt,
      });
      throw new RoomConflictError(conflicts);
    }
    throw err;
  }
}

export async function cancelBooking(
  bookingId: string,
  actor: SessionUser,
  reason?: string,
) {
  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const booking = rows[0];
  if (!booking || booking.status !== "confirmed") {
    throw new PolicyError(
      "NOT_FOUND",
      "Booking tidak ditemukan.",
      "Booking not found.",
    );
  }

  assertCanCancel(booking.startAt, actor, booking.organizerUserId);

  const [updated] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: actor.id,
      cancelReason: reason,
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: actor.id,
    entityType: "booking",
    entityId: bookingId,
    action: "BOOKING_CANCELLED",
    payload: { reason },
  });

  return updated;
}

export class RoomConflictError extends Error {
  conflicts: Awaited<ReturnType<typeof listBookings>>;

  constructor(conflicts: Awaited<ReturnType<typeof listBookings>>) {
    super("Room conflict");
    this.name = "RoomConflictError";
    this.conflicts = conflicts;
  }
}
