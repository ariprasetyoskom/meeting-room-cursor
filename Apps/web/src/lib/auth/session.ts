import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth, isOidcEnabled } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminPortalHost } from "@/lib/portal-shared";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: "employee" | "admin";
};

export async function getSessionUser(
  request?: NextRequest,
): Promise<SessionUser | null> {
  if (!isOidcEnabled()) {
    const host = request?.headers.get("host");
    const envFallback = isAdminPortalHost(host)
      ? (process.env.ADMIN_DEV_USER_ID ?? process.env.DEV_USER_ID)
      : process.env.DEV_USER_ID;
    const devUserId = request?.headers.get("x-dev-user-id") ?? envFallback;
    if (!devUserId) return null;
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

  const session = await auth();
  if (!session?.user?.id || !session.user.email) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.name ?? session.user.email,
    role: session.user.role ?? "employee",
  };
}

export async function requireSessionUser(
  request?: NextRequest,
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

export async function requireAdmin(
  request?: NextRequest,
): Promise<SessionUser> {
  const user = await requireSessionUser(request);
  if (user.role !== "admin") {
    throw new AdminRequiredError();
  }
  return user;
}

export class AdminRequiredError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "AdminRequiredError";
  }
}
