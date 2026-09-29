import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api-response";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import { adminUpdateRoom } from "@/lib/room-service";
import { updateRoomSchema } from "@/lib/validators/room";
import { jsonError } from "@/lib/api-response";

type RouteContext = { params: { id: string } };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireAdmin(request);
    const body = await request.json();
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        "Payload tidak valid.",
        400,
        "Invalid payload.",
        parsed.error.flatten(),
      );
    }
    const room = await adminUpdateRoom(context.params.id, parsed.data, actor);
    return jsonOk({ room });
  } catch (err) {
    return handleAdminRouteError(err);
  }
}
