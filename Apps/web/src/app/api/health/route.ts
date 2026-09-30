import { sql } from "drizzle-orm";
import { db } from "@/db";
import { jsonOk } from "@/lib/api-response";
import { getRedisConnection } from "@/lib/queue/connection";

/** Avoid SSG at `next build` (CI build job has no Postgres/Redis). */
export const dynamic = "force-dynamic";

const PING_TIMEOUT_MS = 2_000;

export async function GET() {
  let dbOk = false;
  try {
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const redis = getRedisConnection();
  let redisOk = false;
  if (redis) {
    try {
      const pong = await Promise.race([
        redis.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("redis ping timeout")), PING_TIMEOUT_MS),
        ),
      ]);
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }
  }

  return jsonOk({
    status: dbOk ? "ok" : "degraded",
    db: dbOk,
    redis: redisOk,
  });
}
