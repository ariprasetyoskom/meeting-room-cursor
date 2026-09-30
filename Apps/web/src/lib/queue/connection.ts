import IORedis from "ioredis";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!connection) {
    connection = new IORedis(url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      connectTimeout: 2_000,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 2 ? null : times * 200),
    });
    connection.on("error", () => {
      /* avoid unhandled error events when Redis is down (e.g. CI build) */
    });
  }
  return connection;
}
