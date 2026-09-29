import {
  findActiveRooms,
  findRoomById,
  insertRoom,
  listAllRooms,
  updateRoomById,
} from "@/db/repositories/rooms.repository";
import { writeAuditLog } from "@/db/repositories/bookings.repository";
import type { SessionUser } from "./auth/session";
import type { CreateRoomInput, UpdateRoomInput } from "./validators/room";
import { PolicyError } from "./booking-policy";

export async function listActiveRooms(filters: {
  floor?: string;
  minCapacity?: number;
}) {
  return findActiveRooms(filters);
}

export async function adminListRooms() {
  return listAllRooms();
}

export async function adminCreateRoom(
  input: CreateRoomInput,
  actor: SessionUser,
) {
  try {
    const created = await insertRoom({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      floor: input.floor?.trim() || null,
      capacity: input.capacity,
      amenities: input.amenities,
      isActive: true,
    });

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "room",
      entityId: created.id,
      action: "ROOM_CREATED",
      payload: { code: created.code, name: created.name },
    });

    return created;
  } catch (err) {
    const pg = err as Error & { code?: string };
    if (pg.code === "23505") {
      throw new PolicyError(
        "ROOM_CODE_EXISTS",
        "Kode ruang sudah dipakai.",
        "Room code already exists.",
      );
    }
    throw err;
  }
}

export async function adminUpdateRoom(
  roomId: string,
  input: UpdateRoomInput,
  actor: SessionUser,
) {
  const existing = await findRoomById(roomId);
  if (!existing) {
    throw new PolicyError(
      "NOT_FOUND",
      "Ruangan tidak ditemukan.",
      "Room not found.",
    );
  }

  try {
    const updated = await updateRoomById(roomId, {
      ...(input.code !== undefined
        ? { code: input.code.trim().toUpperCase() }
        : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.floor !== undefined
        ? { floor: input.floor?.trim() || null }
        : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.amenities !== undefined ? { amenities: input.amenities } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    if (!updated) {
      throw new PolicyError(
        "NOT_FOUND",
        "Ruangan tidak ditemukan.",
        "Room not found.",
      );
    }

    await writeAuditLog({
      actorUserId: actor.id,
      entityType: "room",
      entityId: roomId,
      action: input.isActive === false ? "ROOM_DEACTIVATED" : "ROOM_UPDATED",
      payload: input,
    });

    return updated;
  } catch (err) {
    const pg = err as Error & { code?: string };
    if (pg.code === "23505") {
      throw new PolicyError(
        "ROOM_CODE_EXISTS",
        "Kode ruang sudah dipakai.",
        "Room code already exists.",
      );
    }
    throw err;
  }
}
