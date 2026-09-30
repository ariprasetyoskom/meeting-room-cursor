import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "dev-auth-secret-min-32-chars-long!!");

export default NextAuth({ ...authConfig, secret: authSecret }).auth;

export const config = {
  matcher: [
    "/book/:path*",
    "/bookings/:path*",
    "/rooms/:path*",
    "/admin/:path*",
    "/api/v1/:path*",
    "/login",
  ],
};
