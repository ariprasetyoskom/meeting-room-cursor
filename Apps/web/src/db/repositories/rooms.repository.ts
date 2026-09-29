import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms, type Room } from "@/db/schema";

export async function findActiveRooms(filters: {
  floor?: string;
  minCapacity?: number;
}): Promise<Room[]> {
  const conditions = [eq(rooms.isActive, true)];
  if (filters.floor) {
    conditions.push(eq(rooms.floor, filters.floor));
  }

  const rows = await db.query.rooms.findMany({
    where: and(...conditions),
    orderBy: (roomsTable, { asc }) => [asc(roomsTable.name)],
  });

  if (filters.minCapacity) {
    return rows.filter((r) => r.capacity >= filters.minCapacity!);
  }
  return rows;
}

export async function findActiveRoomById(roomId: string): Promise<Room | null> {
  const row = await db.query.rooms.findFirst({
    where: and(eq(rooms.id, roomId), eq(rooms.isActive, true)),
  });
  return row ?? null;
}

export async function findRoomById(roomId: string): Promise<Room | null> {
  const row = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
  });
  return row ?? null;
}

export async function listAllRooms(): Promise<Room[]> {
  return db.query.rooms.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function insertRoom(
  values: typeof rooms.$inferInsert,
): Promise<Room> {
  const [created] = await db.insert(rooms).values(values).returning();
  return created;
}

export async function updateRoomById(
  roomId: string,
  values: Partial<typeof rooms.$inferInsert>,
): Promise<Room | null> {
  const [updated] = await db
    .update(rooms)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(rooms.id, roomId))
    .returning();
  return updated ?? null;
}
