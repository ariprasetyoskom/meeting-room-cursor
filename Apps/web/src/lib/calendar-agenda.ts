/** Nama organizer untuk slot dan daftar. Selalu ada teks agar D-2 tidak hilang. */
export function organizerDisplayName(name: string | null | undefined): string {
  const trimmed = (name ?? "").replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed : "—";
}

export function occupiedSlotLabel(title: string, organizerName: string): string {
  return `${title}. Organizer ${organizerDisplayName(organizerName)}`;
}

export type AgendaBooking = {
  id: string;
  roomId: string;
  startAt: string;
  status?: string;
};

/** Booking terkonfirmasi untuk ruang yang sedang ditampilkan, urut waktu mulai. */
export function agendaForRooms<T extends AgendaBooking>(
  bookings: readonly T[],
  roomIds: readonly string[],
): T[] {
  const allowed = new Set(roomIds);
  return bookings
    .filter((booking) => allowed.has(booking.roomId) && booking.status !== "cancelled")
    .slice()
    .sort(
      (a, b) =>
        a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id),
    );
}

/** True jika booking overlap dengan jam penuh WIB `hour` pada tanggal `dayYmd`. */
export function bookingCoversSlot(
  booking: { startAt: string; endAt: string },
  dayYmd: string,
  hour: number,
): boolean {
  const slotStart = new Date(
    `${dayYmd}T${String(hour).padStart(2, "0")}:00:00+07:00`,
  );
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  return start < slotEnd && end > slotStart;
}

/**
 * Rentang jam berurutan yang ditutupi booking yang sama.
 * `skip` = jam ini sudah tercakup colspan/rowspan dari jam sebelumnya.
 */
export function occupancySpan(
  hours: readonly number[],
  hour: number,
  bookingIdAt: (hour: number) => string | null,
): "free" | "skip" | number {
  const id = bookingIdAt(hour);
  if (!id) return "free";
  const index = hours.indexOf(hour);
  if (index < 0) return "free";
  if (index > 0 && bookingIdAt(hours[index - 1]!) === id) return "skip";
  let span = 1;
  for (let i = index + 1; i < hours.length; i++) {
    if (bookingIdAt(hours[i]!) !== id) break;
    span += 1;
  }
  return span;
}
