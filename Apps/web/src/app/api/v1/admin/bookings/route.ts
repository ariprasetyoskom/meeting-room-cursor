import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api-response";
import { handleAdminRouteError } from "@/lib/api-admin-errors";
import { listBookings } from "@/lib/booking-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const bookings = await listBookings({
      roomId,
      includeAllStatuses: true,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    const filtered =
      status === "confirmed" || status === "cancelled"
        ? bookings.filter((b) => b.status === status)
        : bookings;

    return jsonOk({ bookings: filtered });
  } catch (err) {
    return handleAdminRouteError(err);
  }
}
