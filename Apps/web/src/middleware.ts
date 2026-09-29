import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/book/:path*",
    "/bookings/:path*",
    "/rooms/:path*",
    "/api/v1/:path*",
    "/login",
  ],
};
