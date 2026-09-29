import {
  cancelBookingRow,
  findBookingById,
  insertBooking,
  listBookingsWithOrganizer,
  writeAuditLog,
} from "@/db/repositories/bookings.repository";
import { findActiveRoomById } from "@/db/repositories/rooms.repository";
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
  includeAllStatuses?: boolean;
}) {
  return listBookingsWithOrganizer(params);
}

export async function createBooking(
  input: CreateBookingInput,
  actor: SessionUser,
) {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  assertBookingWindow(startAt, endAt);

  const room = await findActiveRoomById(input.roomId);
  if (!room) {
    throw new PolicyError(
      "ROOM_NOT_FOUND",
      "Ruangan tidak ditemukan atau tidak aktif.",
      "Room not found or inactive.",
    );
  }

  try {
    const created = await insertBooking({
      roomId: input.roomId,
      organizerUserId: actor.id,
      title: input.title,
      description: input.description,
      startAt,
      endAt,
      status: "confirmed",
    });

    await writeAuditLog({
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
      const conflicts = await listBookingsWithOrganizer({
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
  const booking = await findBookingById(bookingId);
  if (!booking || booking.status !== "confirmed") {
    throw new PolicyError(
      "NOT_FOUND",
      "Booking tidak ditemukan.",
      "Booking not found.",
    );
  }

  if (actor.role === "admin" && !reason?.trim()) {
    throw new PolicyError(
      "REASON_REQUIRED",
      "Alasan wajib untuk pembatalan oleh admin.",
      "Cancel reason is required for admin cancellation.",
    );
  }

  assertCanCancel(booking.startAt, actor, booking.organizerUserId);

  const updated = await cancelBookingRow(bookingId, actor.id, reason?.trim());

  await writeAuditLog({
    actorUserId: actor.id,
    entityType: "booking",
    entityId: bookingId,
    action: "BOOKING_CANCELLED",
    payload: { reason },
  });

  return updated;
}

export class RoomConflictError extends Error {
  conflicts: Awaited<ReturnType<typeof listBookingsWithOrganizer>>;

  constructor(conflicts: Awaited<ReturnType<typeof listBookingsWithOrganizer>>) {
    super("Room conflict");
    this.name = "RoomConflictError";
    this.conflicts = conflicts;
  }
}
