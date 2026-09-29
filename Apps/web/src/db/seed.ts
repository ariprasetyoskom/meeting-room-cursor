import { eq } from "drizzle-orm";
import "dotenv/config";
import { db, sql } from "./index";
import { rooms, users } from "./schema";

async function main() {
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

  const seedRooms = [
    {
      code: "MR-A",
      name: "Ruang A",
      floor: "3",
      capacity: 8,
      amenities: ["tv", "whiteboard"],
    },
    {
      code: "MR-B",
      name: "Ruang B",
      floor: "3",
      capacity: 4,
      amenities: ["vc"],
    },
    {
      code: "MR-C",
      name: "Ruang C",
      floor: "4",
      capacity: 12,
      amenities: ["tv", "vc", "whiteboard"],
    },
  ];

  for (const room of seedRooms) {
    await db.insert(rooms).values(room).onConflictDoNothing({ target: rooms.code });
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

  console.log("Seed complete.");
  if (employeeRow) {
    console.log(`DEV_USER_ID=${employeeRow.id}`);
  }
  if (admin) {
    console.log(`Admin user id: ${admin.id}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
