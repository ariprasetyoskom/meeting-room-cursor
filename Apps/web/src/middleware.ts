import NextAuth from "next-auth";
import { NextResponse } from "next/server";
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
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/login",
    "/book",
    "/bookings",
    "/bookings/:path*",
    "/rooms",
    "/rooms/:path*",
    "/admin/:path*",
    "/api/v1/:path*",
  ],
};
