import type { NextRequest } from "next/server";
import {
  AuthRequiredError,
  requireSessionUser,
} from "@/lib/auth/session";
import { listActiveRooms } from "@/lib/room-service";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await requireSessionUser(request);
    const { searchParams } = new URL(request.url);
    const floor = searchParams.get("floor") ?? undefined;
    const minCapacity = searchParams.get("minCapacity");
    const rooms = await listActiveRooms({
      floor,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
    });
    return jsonOk({ rooms });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return jsonError(
        "UNAUTHORIZED",
        "Autentikasi diperlukan.",
        401,
        "Authentication required.",
      );
    }
    console.error("[GET /api/v1/rooms]", err);
    return jsonError(
      "INTERNAL_ERROR",
      "Gagal memuat daftar ruang. Periksa koneksi database (Docker Postgres port 5434).",
      503,
      "Failed to load rooms. Check database connectivity.",
    );
  }
}
