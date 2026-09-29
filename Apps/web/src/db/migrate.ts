import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import "dotenv/config";

async function main() {
  const url =
    process.env.DATABASE_URL ??
    "postgresql://booking:booking_dev@localhost:5432/booking_meeting";
  const sql = postgres(url, { max: 1 });
  const migrationsDir = join(process.cwd(), "drizzle", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const migration = readFileSync(join(migrationsDir, file), "utf8");
    await sql.unsafe(migration);
    console.log(`Applied ${file}`);
  }
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
