import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import { authConfig } from "./auth.config";
import { upsertOidcUser } from "@/lib/auth/upsert-user";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (
    process.env.OIDC_ISSUER &&
    process.env.OIDC_CLIENT_ID &&
    process.env.OIDC_CLIENT_SECRET
  ) {
    providers.push({
      id: "oidc",
      name: process.env.OIDC_PROVIDER_NAME ?? "Corporate SSO",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: {
        params: {
          scope: process.env.OIDC_SCOPE ?? "openid email profile",
        },
      },
    });
  }

  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "dev-auth-secret-min-32-chars-long!!"),
  providers: buildProviders(),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile }) {
      if (account?.provider === "oidc" && profile) {
        const email =
          typeof profile.email === "string"
            ? profile.email
            : typeof (profile as { preferred_username?: string })
                  .preferred_username === "string"
              ? (profile as { preferred_username: string }).preferred_username
              : null;
        const sub = profile.sub ?? account.providerAccountId;
        if (email && sub) {
          const name =
            typeof profile.name === "string" ? profile.name : email;
          const dbUser = await upsertOidcUser({
            email,
            name,
            sub: String(sub),
          });
          if (dbUser) {
            token.dbUserId = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.dbUserId && session.user) {
        session.user.id = token.dbUserId as string;
        session.user.role = (token.role as "employee" | "admin") ?? "employee";
      }
      return session;
    },
  },
});

export function isOidcEnabled(): boolean {
  return (process.env.AUTH_MODE ?? "dev") === "oidc";
}

export function isOidcConfigured(): boolean {
  return buildProviders().length > 0;
}
