import { sql } from "@/db";
import { jsonOk } from "@/lib/api-response";
import { getRedisConnection } from "@/lib/queue/connection";

export async function GET() {
  let dbOk = false;
  try {
    await sql`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const redis = getRedisConnection();
  let redisOk = false;
  if (redis) {
    try {
      redisOk = (await redis.ping()) === "PONG";
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
