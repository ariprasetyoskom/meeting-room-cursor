import { loadAppEnv } from "../src/db/load-env.ts";

loadAppEnv();
const url = process.env.DATABASE_URL ?? "";
console.log("DATABASE_URL", url.replace(/:[^:@]+@/, ":***@"));

const t0 = Date.now();
const { sql } = await import("../src/db/index.ts");
await sql`SELECT 1`;
console.log("SELECT 1 ok", `${Date.now() - t0}ms`);
await sql.end({ timeout: 2 });
process.exit(0);
