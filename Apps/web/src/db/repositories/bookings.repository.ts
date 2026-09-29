import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  bookings,
  type Booking,
} from "@/db/schema";

export type BookingWithOrganizer = Booking & {
  organizerName: string;
};

function buildListConditions(params: {
  roomId?: string;
  from?: Date;
  to?: Date;
  organizerUserId?: string;
  includeAllStatuses?: boolean;
}) {
  const conditions = [];
  if (!params.includeAllStatuses) {
    conditions.push(eq(bookings.status, "confirmed"));
  }
  if (params.roomId) conditions.push(eq(bookings.roomId, params.roomId));
  if (params.organizerUserId) {
    conditions.push(eq(bookings.organizerUserId, params.organizerUserId));
  }
  if (params.from) conditions.push(gte(bookings.startAt, params.from));
  if (params.to) conditions.push(lte(bookings.endAt, params.to));
  return conditions;
}

export async function listBookingsWithOrganizer(params: {
  roomId?: string;
  from?: Date;
  to?: Date;
  organizerUserId?: string;
  includeAllStatuses?: boolean;
}): Promise<BookingWithOrganizer[]> {
  const conditions = buildListConditions(params);

  const rows = await db.query.bookings.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { organizer: true },
    orderBy: asc(bookings.startAt),
  });

  return rows.map((row) => ({
    ...row,
    organizerName: row.organizer.displayName,
  }));
}

export async function insertBooking(
  values: typeof bookings.$inferInsert,
): Promise<Booking> {
  const [created] = await db.insert(bookings).values(values).returning();
  return created;
}

export async function findBookingById(
  bookingId: string,
): Promise<Booking | null> {
  const row = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  });
  return row ?? null;
}

export async function cancelBookingRow(
  bookingId: string,
  actorUserId: string,
  reason?: string,
): Promise<Booking> {
  const [updated] = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy: actorUserId,
      cancelReason: reason,
    })
    .where(eq(bookings.id, bookingId))
    .returning();
  return updated;
}

export async function writeAuditLog(
  values: typeof auditLogs.$inferInsert,
): Promise<void> {
  await db.insert(auditLogs).values(values);
}
