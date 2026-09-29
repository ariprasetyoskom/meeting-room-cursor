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
