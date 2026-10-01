export type BoardStatus =
  | "intake"
  | "plan"
  | "development"
  | "test"
  | "audit"
  | "human_clarify"
  | "human_qa"
  | "done";

export type BoardCard = {
  number: number;
  title: string;
  status: BoardStatus;
};

export const BOARD_REPO = "meeting-room-cursor";

/** Kolom geser ke sini memicu Cursor Automation (KAD). */
export const BOARD_DISPATCH_STAGE: BoardStatus = "development";

export const BOARD_COLUMNS: {
  id: BoardStatus;
  label: string;
  description: string;
  humanGate?: boolean;
}[] = [
  {
    id: "intake",
    label: "Intake",
    description: "Issue masuk antrian; belum direncanakan",
  },
  {
    id: "plan",
    label: "Plan",
    description: "Acuan, scope task, manifest pelaksana",
  },
  {
    id: "development",
    label: "Development",
    description: "Implementasi kode & dokumen development",
  },
  {
    id: "test",
    label: "Test",
    description: "Verifikasi otomatis / bukti lulus",
  },
  {
    id: "audit",
    label: "Audit",
    description: "Review diff & kontrak task (bukan pelaksana develop)",
  },
  {
    id: "human_clarify",
    label: "Human Clarify",
    description: "Menunggu jawaban manusia (gate clarify)",
    humanGate: true,
  },
  {
    id: "human_qa",
    label: "Human QA",
    description: "Penerimaan manusia sebelum tutup",
    humanGate: true,
  },
  {
    id: "done",
    label: "Done",
    description: "Task selesai dan diterima",
  },
];

/** Wave 1 #1–#29, epic #30, UI #31–#40. Status awal selaras alur ORCH di papan. */
export const BOARD_CARDS: BoardCard[] = [
  { number: 1, status: "intake", title: "[W1-R-01] Doc REDIS_URL 127.0.0.1 + troubleshooting Windows" },
  { number: 2, status: "intake", title: "[W1-R-02] Health: redis ping connect explicit / timeout 2s" },
  { number: 3, status: "intake", title: "[W1-R-03] Opsional family 4 ioredis connection.ts" },
  { number: 4, status: "intake", title: "[W1-R-04] CI/doc: health tidak wajib redis hijau di build" },
  { number: 5, status: "intake", title: "[W1-M-01] nodemailer + lib/mail/transport.ts" },
  { number: 6, status: "intake", title: "[W1-M-02] sendMail helper + log messageId" },
  { number: 7, status: "intake", title: "[W1-M-03] Env EMAIL_FROM SMTP di .env.example + README Ops" },
  { number: 8, status: "intake", title: "[W1-M-04] Wire worker SMTP sendMail (ganti stub)" },
  { number: 9, status: "intake", title: "[W1-T-01] Template confirm bilingual ke lib/email/templates" },
  { number: 10, status: "intake", title: "[W1-T-02] Template cancel (organizer + admin copy)" },
  { number: 11, status: "intake", title: "[W1-T-03] Template reminder bilingual" },
  { number: 12, status: "intake", title: "[W1-T-04] Escape HTML field user (XSS)" },
  { number: 13, status: "intake", title: "[W1-T-05] PO review copy ID/EN checklist" },
  { number: 14, status: "intake", title: "[W1-Q-01] enqueueBookingCancelEmail + cancelBooking" },
  { number: 15, status: "intake", title: "[W1-Q-02] Worker handlers confirm + cancel" },
  { number: 16, status: "intake", title: "[W1-Q-03] Job payload minimal bookingId" },
  { number: 17, status: "intake", title: "[W1-Q-04] Log structured email sent/failed + BullMQ attempts" },
  { number: 18, status: "intake", title: "[W1-S-01] Env BOOKING_REMINDER_MINUTES_BEFORE=60" },
  { number: 19, status: "intake", title: "[W1-S-02] Reminder scanner (BullMQ repeatable atau cron)" },
  { number: 20, status: "intake", title: "[W1-S-03] Idempotency reminder (kolom atau Redis SET)" },
  { number: 21, status: "intake", title: "[W1-S-04] Worker job email.booking.reminder" },
  { number: 22, status: "intake", title: "[W1-O-01] Mailhog/Mailpit di docker-compose" },
  { number: 23, status: "intake", title: "[W1-O-02] Contoh dev SMTP Mailhog README" },
  { number: 24, status: "intake", title: "[W1-O-03] Runbook staging worker + REDIS + SendGrid" },
  { number: 25, status: "intake", title: "[W1-O-04] Script worker:reminder jika cron terpisah" },
  { number: 26, status: "intake", title: "[W1-V-01] Manual QA Wave 1 (confirm cancel reminder)" },
  { number: 27, status: "intake", title: "[W1-V-02] Update PRD 4.1 F-10 Selesai" },
  { number: 28, status: "intake", title: "[W1-V-03] Centang BRD 13 email bilingual" },
  { number: 29, status: "intake", title: "[W1-V-04] Demo akhir sprint PO/Facilities" },
  { number: 30, status: "development", title: "[UI-EPIC] UI enhance — token ke /book (MVP polish)" },
  { number: 31, status: "done", title: "[UI-01] Audit & refine design tokens (globals.css light/dark)" },
  { number: 32, status: "done", title: "[UI-02] Kit ui: Button Input Card Alert di components/ui" },
  { number: 33, status: "done", title: "[UI-03] Polish AppShell MainNav AdminNav UserMenu mobile" },
  { number: 34, status: "done", title: "[UI-04] RoomPicker kartu ruang hierarchy selected a11y" },
  { number: 35, status: "development", title: "[UI-05] BookingCalendar Hari Minggu Daftar readability scroll" },
  { number: 36, status: "intake", title: "[UI-06] BookingModal form labels errors loading states" },
  { number: 37, status: "intake", title: "[UI-07] RoomDirectory + MyBookingsList empty error CTA" },
  { number: 38, status: "intake", title: "[UI-08] Admin rooms bookings audit table density feedback" },
  { number: 39, status: "intake", title: "[UI-09] Halaman detail ruang /rooms/[code] F-03 text-first" },
  { number: 40, status: "intake", title: "[UI-10] Dark mode + a11y smoke alur booking" },
];

export function filterCards(cards: BoardCard[], query: string): BoardCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter((card) => {
    const repoLine = `${BOARD_REPO} #${card.number}`.toLowerCase();
    return (
      card.title.toLowerCase().includes(q) ||
      repoLine.includes(q) ||
      String(card.number) === q.replace(/^#/, "")
    );
  });
}

export function moveCard(
  cards: BoardCard[],
  number: number,
  status: BoardStatus,
): BoardCard[] {
  return cards.map((card) =>
    card.number === number ? { ...card, status } : card,
  );
}

/** Sub-issue UI #31–#40 yang sudah Done, untuk bar progres epic #30. */
export function uiEpicProgress(cards: BoardCard[]): { done: number; total: number } {
  const children = cards.filter((card) => card.number >= 31 && card.number <= 40);
  return {
    done: children.filter((card) => card.status === "done").length,
    total: children.length,
  };
}
