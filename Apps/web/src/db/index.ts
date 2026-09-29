import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { loadAppEnv } from "./load-env";
import * as schema from "./schema";

if (process.env.NODE_ENV !== "production") {
  loadAppEnv();
}

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://booking:booking_dev@127.0.0.1:5434/booking_meeting";

const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

export const sql =
  globalForDb.sql ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql;
}

/** Drizzle ORM — single database access layer */
export const db = drizzle(sql, { schema });

export { schema };
