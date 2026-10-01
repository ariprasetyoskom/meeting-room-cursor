import type { Room } from "@/lib/client-api";

/** Urutan kartu konsisten MR-A … MR-E (Design §6.1). */
export function sortRoomsByCode(rooms: Room[]): Room[] {
  return [...rooms].sort((a, b) => a.code.localeCompare(b.code, "en"));
}

export function formatRoomMeta(room: Room): string {
  return `Lantai ${room.floor ?? "—"} · ${room.capacity} orang`;
}

export function formatAmenities(amenities: string[] | undefined): string {
  if (!amenities?.length) return "—";
  return amenities.map((a) => a.replace(/_/g, " ")).join(" · ");
}

export function roomOptionLabel(room: Room): string {
  return `${room.code} ${room.name}, ${formatRoomMeta(room)}`;
}

/** Normalisasi segmen URL `/rooms/[code]` (case-insensitive). */
export function normalizeRoomCodeParam(raw: string): string {
  return decodeURIComponent(raw).trim().toUpperCase();
}

export function roomDetailHref(code: string): string {
  return `/rooms/${encodeURIComponent(code.trim().toUpperCase())}`;
}
