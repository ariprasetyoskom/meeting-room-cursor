import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { resolvePortalRedirect } from "@/lib/portal";

const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "dev-auth-secret-min-32-chars-long!!");

const { auth } = NextAuth({ ...authConfig, secret: authSecret });

export default auth((request) => {
  const portalRedirect = resolvePortalRedirect(request);
  if (portalRedirect) return portalRedirect;
});

export const config = {
  matcher: [
    "/book/:path*",
    "/bookings/:path*",
    "/rooms/:path*",
    "/admin/:path*",
    "/api/v1/:path*",
    "/login",
    "/",
  ],
};
