import {
  AdminRequiredError,
  AuthRequiredError,
} from "@/lib/auth/session";
import { PolicyError } from "@/lib/booking-policy";
import { jsonError } from "@/lib/api-response";

export function handleAdminRouteError(err: unknown) {
  if (err instanceof AuthRequiredError) {
    return jsonError(
      "UNAUTHORIZED",
      "Autentikasi diperlukan.",
      401,
      "Authentication required.",
    );
  }
  if (err instanceof AdminRequiredError) {
    return jsonError(
      "FORBIDDEN",
      "Akses admin diperlukan.",
      403,
      "Admin access required.",
    );
  }
  if (err instanceof PolicyError) {
    const status =
      err.code === "NOT_FOUND"
        ? 404
        : err.code === "ROOM_CODE_EXISTS"
          ? 409
          : 400;
    return jsonError(err.code, err.message, status, err.messageEn);
  }
  throw err;
}
