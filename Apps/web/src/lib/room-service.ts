import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";

export async function listActiveRooms(filters: {
  floor?: string;
  minCapacity?: number;
}) {
  const conditions = [eq(rooms.isActive, true)];
  if (filters.floor) {
    conditions.push(eq(rooms.floor, filters.floor));
  }
  return db
    .select()
    .from(rooms)
    .where(and(...conditions))
    .then((rows) =>
      rows.filter((r) =>
        filters.minCapacity ? r.capacity >= filters.minCapacity : true,
      ),
    );
}
