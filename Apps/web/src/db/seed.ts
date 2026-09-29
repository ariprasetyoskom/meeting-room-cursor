import { eq } from "drizzle-orm";
import { loadAppEnv } from "./load-env";

async function main() {
  loadAppEnv();
  const { db, sql } = await import("./index");
  const { rooms, users } = await import("./schema");

  const [employee] = await db
    .insert(users)
    .values({
      email: "employee@example.com",
      displayName: "Andi Wijaya",
      role: "employee",
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@example.com",
      displayName: "Budi GA",
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  const { SEED_ROOMS } = await import("../data/seed-rooms");

  for (const room of SEED_ROOMS) {
    await db
      .insert(rooms)
      .values({ ...room, amenities: [...room.amenities] })
      .onConflictDoUpdate({
        target: rooms.code,
        set: {
          name: room.name,
          floor: room.floor,
          capacity: room.capacity,
          amenities: [...room.amenities],
          isActive: true,
        },
      });
  }

  let employeeRow = employee;
  if (!employeeRow) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, "employee@example.com"))
      .limit(1);
    employeeRow = rows[0];
  }

  let adminRow = admin;
  if (!adminRow) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .limit(1);
    adminRow = rows[0];
  }

  console.log("Seed complete.");
  if (employeeRow) {
    console.log(`DEV_USER_ID=${employeeRow.id}`);
  }
  if (adminRow) {
    console.log(`ADMIN_DEV_USER_ID=${adminRow.id}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
