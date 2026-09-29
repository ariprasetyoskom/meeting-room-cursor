import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import "dotenv/config";
import { db, sql } from "@/db";
import { bookings } from "@/db/schema";
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
  const row = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { room: true, organizer: true },
  });
  if (!row) return;

  const message = formatBilingualEmail({
    title: row.title,
    roomName: row.room.name,
    startAt: row.startAt,
    organizerName: row.organizer.displayName,
  });

  // MVP: log email; wire SMTP when credentials are configured
  if (process.env.SMTP_HOST) {
    console.info(
      "[email] SMTP send pending implementation for",
      row.organizer.email,
    );
  } else {
    console.info("[email] dev preview", {
      to: row.organizer.email,
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
