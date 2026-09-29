import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadAppEnv } from "./load-env";

async function applyCustomSql(sql: { unsafe: (q: string) => Promise<unknown> }) {
  const customPath = join(
    process.cwd(),
    "drizzle",
    "custom",
    "booking_constraints.sql",
  );
  const custom = readFileSync(customPath, "utf8");
  await sql.unsafe(custom);
  console.log("Applied drizzle/custom/booking_constraints.sql");
}

async function main() {
  loadAppEnv();
  const { db, sql } = await import("./index");

  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("Drizzle ORM migrations applied.");
  await applyCustomSql(sql);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
