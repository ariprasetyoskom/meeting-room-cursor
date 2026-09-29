import type { NextRequest } from "next/server";
import {
  AuthRequiredError,
  requireSessionUser,
} from "@/lib/auth/session";
import {
  createBooking,
  listBookings,
  RoomConflictError,
} from "@/lib/booking-service";
import { PolicyError } from "@/lib/booking-policy";
import { jsonError, jsonOk } from "@/lib/api-response";
import { createBookingSchema } from "@/lib/validators/booking";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId") ?? undefined;
    const mine = searchParams.get("mine") === "true";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const bookings = await listBookings({
      roomId,
      organizerUserId: mine ? user.id : undefined,
      includeAllStatuses: mine,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    return jsonOk({ bookings });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return jsonError(
        "UNAUTHORIZED",
        "Autentikasi diperlukan.",
        401,
        "Authentication required.",
      );
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        "Payload tidak valid.",
        400,
        "Invalid payload.",
        parsed.error.flatten(),
      );
    }

    const booking = await createBooking(parsed.data, user);
    return jsonOk({ booking }, 201);
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return jsonError(
        "UNAUTHORIZED",
        "Autentikasi diperlukan.",
        401,
        "Authentication required.",
      );
    }
    if (err instanceof PolicyError) {
      return jsonError(err.code, err.message, 400, err.messageEn);
    }
    if (err instanceof RoomConflictError) {
      return jsonError(
        "ROOM_CONFLICT",
        "Ruangan sudah dibooking pada slot ini.",
        409,
        "This room is already booked for that time.",
        {
          conflicts: err.conflicts.map((c) => ({
            id: c.id,
            title: c.title,
            startAt: c.startAt,
            endAt: c.endAt,
            organizerName: c.organizerName,
          })),
        },
      );
    }
    throw err;
  }
}
