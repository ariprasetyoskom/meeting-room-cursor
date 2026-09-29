import { findActiveRooms } from "@/db/repositories/rooms.repository";

export async function listActiveRooms(filters: {
  floor?: string;
  minCapacity?: number;
}) {
  return findActiveRooms(filters);
}
