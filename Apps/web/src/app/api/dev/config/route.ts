import { isOidcConfigured } from "@/auth";
import { jsonOk } from "@/lib/api-response";
import { isAdminPortalHost } from "@/lib/portal-shared";

export async function GET(request: Request) {
  const host = request.headers.get("host");
  const onAdminPortal = isAdminPortalHost(host);
  const adminSeedUserId = process.env.ADMIN_DEV_USER_ID ?? null;
  const defaultUserId = onAdminPortal
    ? (adminSeedUserId ?? process.env.DEV_USER_ID ?? null)
    : (process.env.DEV_USER_ID ?? null);

  return jsonOk({
    authMode: process.env.AUTH_MODE ?? "dev",
    defaultUserId,
    adminSeedUserId,
    portal: onAdminPortal ? "admin" : "app",
    oidcConfigured: isOidcConfigured(),
  });
}
