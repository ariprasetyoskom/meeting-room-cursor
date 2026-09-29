import { bookingConfig } from "./env";

export function assertBookingWindow(
  startAt: Date,
  endAt: Date,
  now = new Date(),
): void {
  const leadMs = bookingConfig.minLeadMinutes * 60 * 1000;
  if (startAt.getTime() < now.getTime() + leadMs) {
    throw new PolicyError(
      "BOOKING_TOO_SOON",
      "Booking harus minimal 15 menit dari sekarang.",
      "Booking must start at least 15 minutes from now.",
    );
  }

  const durationMs = endAt.getTime() - startAt.getTime();
  const minMs = bookingConfig.minDurationMinutes * 60 * 1000;
  const maxMs = bookingConfig.maxDurationHours * 60 * 60 * 1000;

  if (durationMs < minMs || durationMs > maxMs) {
    throw new PolicyError(
      "INVALID_DURATION",
      "Durasi booking tidak valid (30 menit – 8 jam).",
      "Invalid booking duration (30 minutes – 8 hours).",
    );
  }

  if (endAt <= startAt) {
    throw new PolicyError(
      "INVALID_RANGE",
      "Waktu selesai harus setelah waktu mulai.",
      "End time must be after start time.",
    );
  }
}

export function assertCanCancel(
  startAt: Date,
  actor: { id: string; role: "employee" | "admin" },
  organizerId: string,
  now = new Date(),
): void {
  if (actor.role === "admin") return;
  if (actor.id !== organizerId) {
    throw new PolicyError(
      "FORBIDDEN",
      "Anda tidak dapat membatalkan booking ini.",
      "You cannot cancel this booking.",
    );
  }
  const windowMs = bookingConfig.cancelWindowHours * 60 * 60 * 1000;
  if (startAt.getTime() - now.getTime() < windowMs) {
    throw new PolicyError(
      "CANCEL_CUTOFF",
      `Pembatalan dibatasi ${bookingConfig.cancelWindowHours} jam sebelum meeting.`,
      `Cancellation is restricted within ${bookingConfig.cancelWindowHours} hours of start.`,
    );
  }
}

export class PolicyError extends Error {
  code: string;
  messageEn: string;

  constructor(code: string, message: string, messageEn: string) {
    super(message);
    this.code = code;
    this.messageEn = messageEn;
    this.name = "PolicyError";
  }
}
