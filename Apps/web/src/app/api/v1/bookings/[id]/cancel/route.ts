import type { NextRequest } from "next/server";
import {
  AuthRequiredError,
  requireSessionUser,
} from "@/lib/auth/session";
import { cancelBooking } from "@/lib/booking-service";
import { PolicyError } from "@/lib/booking-policy";
import { jsonError, jsonOk } from "@/lib/api-response";
import { cancelBookingSchema } from "@/lib/validators/booking";

type RouteContext = { params: { id: string } };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireSessionUser(request);
    const body = await request.json().catch(() => ({}));
    const parsed = cancelBookingSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "VALIDATION_ERROR",
        "Payload tidak valid.",
        400,
        "Invalid payload.",
        parsed.error.flatten(),
      );
    }

    const booking = await cancelBooking(
      context.params.id,
      user,
      parsed.data.reason,
    );
    return jsonOk({ booking });
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
      const status =
        err.code === "FORBIDDEN"
          ? 403
          : err.code === "NOT_FOUND"
            ? 404
            : 400;
      return jsonError(err.code, err.message, status, err.messageEn);
    }
    throw err;
  }
}
