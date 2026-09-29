import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api-response";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import { adminCreateRoom, adminListRooms } from "@/lib/room-service";
import { createRoomSchema } from "@/lib/validators/room";
import { jsonError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const rooms = await adminListRooms();
    return jsonOk({ rooms });
  } catch (err) {
    return handleAdminRouteError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        "Payload tidak valid.",
        400,
        "Invalid payload.",
        parsed.error.flatten(),
      );
    }
    const room = await adminCreateRoom(parsed.data, actor);
    return jsonOk({ room }, 201);
  } catch (err) {
    return handleAdminRouteError(err);
  }
}
