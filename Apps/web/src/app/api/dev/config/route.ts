import { isOidcConfigured } from "@/auth";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  return jsonOk({
    authMode: process.env.AUTH_MODE ?? "dev",
    defaultUserId: process.env.DEV_USER_ID ?? null,
    oidcConfigured: isOidcConfigured(),
  });
}
