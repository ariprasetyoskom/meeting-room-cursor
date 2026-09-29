import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://booking:booking_dev@localhost:5432/booking_meeting";

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
