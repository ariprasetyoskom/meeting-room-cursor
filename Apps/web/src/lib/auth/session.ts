import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: "employee" | "admin";
};

export async function getSessionUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const authMode = process.env.AUTH_MODE ?? "dev";
  const devUserId =
    request.headers.get("x-dev-user-id") ?? process.env.DEV_USER_ID;

  if (authMode === "dev" && devUserId) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, devUserId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
    };
  }

  // OIDC / Auth.js: wire in next iteration
  return null;
}

export async function requireSessionUser(
  request: NextRequest,
): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new AuthRequiredError();
  }
  return user;
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}
