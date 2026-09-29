import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function upsertOidcUser(input: {
  email: string;
  name: string;
  sub: string;
}) {
  const email = input.email.toLowerCase().trim();
  const displayName = input.name.trim() || email;

  const bySub = await db
    .select()
    .from(users)
    .where(eq(users.externalSub, input.sub))
    .limit(1);
  if (bySub[0]) {
    const [updated] = await db
      .update(users)
      .set({ displayName, email })
      .where(eq(users.id, bySub[0].id))
      .returning();
    return updated;
  }

  const [row] = await db
    .insert(users)
    .values({
      email,
      displayName,
      externalSub: input.sub,
      role: "employee",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        displayName,
        externalSub: input.sub,
      },
    })
    .returning();

  return row;
}

export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}
