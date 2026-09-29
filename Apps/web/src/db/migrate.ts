import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import "dotenv/config";

async function main() {
  const url =
    process.env.DATABASE_URL ??
    "postgresql://booking:booking_dev@localhost:5432/booking_meeting";
  const sql = postgres(url, { max: 1 });
  const migrationPath = join(
    process.cwd(),
    "drizzle",
    "migrations",
    "0000_initial.sql",
  );
  const migration = readFileSync(migrationPath, "utf8");
  await sql.unsafe(migration);
  await sql.end();
  console.log("Migration 0000_initial applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
