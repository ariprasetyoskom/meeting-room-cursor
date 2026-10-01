import type { NextRequest } from "next/server";
import {
  AuthRequiredError,
  requireSessionUser,
} from "@/lib/auth/session";
import { getActiveRoomByCode } from "@/lib/room-service";
import { normalizeRoomCodeParam } from "@/lib/room-display";
import { jsonError, jsonOk } from "@/lib/api-response";

type RouteContext = { params: { code: string } };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireSessionUser(request);
    const code = normalizeRoomCodeParam(context.params.code);
    const room = await getActiveRoomByCode(code);
    if (!room) {
      return jsonError(
        "NOT_FOUND",
        "Ruangan tidak ditemukan atau tidak aktif.",
        404,
        "Room not found or inactive.",
      );
    }
    return jsonOk({ room });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return jsonError(
        "UNAUTHORIZED",
        "Autentikasi diperlukan.",
        401,
        "Authentication required.",
      );
    }
    console.error("[GET /api/v1/rooms/:code]", err);
    return jsonError(
      "INTERNAL_ERROR",
      "Gagal memuat detail ruang.",
      503,
      "Failed to load room detail.",
    );
  }
}
