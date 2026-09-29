import type { NextAuthConfig } from "next-auth";

const authMode = process.env.AUTH_MODE ?? "dev";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname === "/api/health" ||
        pathname.startsWith("/api/dev");

      if (isPublic) return true;
      if (authMode === "dev") return true;
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
