import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import "dotenv/config";
import { db, sql } from "@/db";
import { bookings, rooms, users } from "@/db/schema";
import { getRedisConnection } from "@/lib/queue/connection";

const connection = getRedisConnection();
if (!connection) {
  console.error("REDIS_URL required for email worker");
  process.exit(1);
}

function formatBilingualEmail(payload: {
  title: string;
  roomName: string;
  startAt: Date;
  organizerName: string;
}) {
  const idTime = payload.startAt.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
  });
  const enTime = payload.startAt.toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });

  return {
    subject: `[Ruangan Meeting / Meeting Room] Dikonfirmasi / Confirmed: ${payload.title}`,
    html: `
<section lang="id">
  <p>Booking Anda telah dikonfirmasi.</p>
  <ul>
    <li>Judul: ${payload.title}</li>
    <li>Ruang: ${payload.roomName}</li>
    <li>Waktu: ${idTime} (WIB)</li>
    <li>Organizer: ${payload.organizerName}</li>
  </ul>
</section>
<hr />
<section lang="en">
  <p>Your booking has been confirmed.</p>
  <ul>
    <li>Title: ${payload.title}</li>
    <li>Room: ${payload.roomName}</li>
    <li>Time: ${enTime} (WIB)</li>
    <li>Organizer: ${payload.organizerName}</li>
  </ul>
</section>`,
  };
}

async function handleConfirm(bookingId: string) {
  const rows = await db
    .select({
      title: bookings.title,
      startAt: bookings.startAt,
      roomName: rooms.name,
      organizerName: users.displayName,
      email: users.email,
    })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .innerJoin(users, eq(bookings.organizerUserId, users.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  const row = rows[0];
  if (!row) return;

  const message = formatBilingualEmail({
    title: row.title,
    roomName: row.roomName,
    startAt: row.startAt,
    organizerName: row.organizerName,
  });

  // MVP: log email; wire SMTP when credentials are configured
  if (process.env.SMTP_HOST) {
    console.info("[email] SMTP send pending implementation for", row.email);
  } else {
    console.info("[email] dev preview", {
      to: row.email,
      subject: message.subject,
    });
  }
}

const worker = new Worker(
  "email",
  async (job) => {
    if (job.name === "email.booking.confirm") {
      await handleConfirm(job.data.bookingId as string);
    }
  },
  { connection },
);

worker.on("failed", (job, err) => {
  console.error("[email-worker] failed", job?.id, err);
});

console.log("Email worker listening on queue: email");

process.on("SIGINT", async () => {
  await worker.close();
  await sql.end();
  process.exit(0);
});
