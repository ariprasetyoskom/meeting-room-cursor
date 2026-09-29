import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

const QUEUE_NAME = "email";

function getEmailQueue(): Queue | null {
  const connection = getRedisConnection();
  if (!connection) return null;
  return new Queue(QUEUE_NAME, { connection });
}

export async function enqueueBookingConfirmEmail(bookingId: string) {
  const queue = getEmailQueue();
  if (!queue) {
    console.info("[email] skipped (no REDIS_URL), bookingId=", bookingId);
    return;
  }
  await queue.add(
    "email.booking.confirm",
    { bookingId },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
    },
  );
}
