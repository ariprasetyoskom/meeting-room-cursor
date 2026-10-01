const AUDIT_ACTION_LABELS: Record<string, string> = {
  BOOKING_CREATED: "Booking dibuat",
  BOOKING_CANCELLED: "Booking dibatalkan",
  ROOM_CREATED: "Ruang ditambahkan",
  ROOM_UPDATED: "Ruang diperbarui",
  ROOM_DEACTIVATED: "Ruang dinonaktifkan",
};

export function formatAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replaceAll("_", " ").toLowerCase();
}

export function formatAuditPayload(payload: unknown): string {
  if (payload == null) return "—";
  if (typeof payload === "string") return payload;
  try {
    const text = JSON.stringify(payload);
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  } catch {
    return "—";
  }
}
