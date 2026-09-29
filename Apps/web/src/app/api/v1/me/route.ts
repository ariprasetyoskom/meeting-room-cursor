import {
  AuthRequiredError,
  requireSessionUser,
} from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api-response";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    return jsonOk({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });
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
