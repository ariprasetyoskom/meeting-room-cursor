/** PRD §6 / Design §8 — shown on 409 ROOM_CONFLICT */
export const BOOKING_ROOM_CONFLICT_MESSAGE =
  "Ruangan sudah dipesan pada waktu ini.";

export function bookingApiErrorMessage(code: string, fallback: string): string {
  if (code === "ROOM_CONFLICT") return BOOKING_ROOM_CONFLICT_MESSAGE;
  return fallback;
}
