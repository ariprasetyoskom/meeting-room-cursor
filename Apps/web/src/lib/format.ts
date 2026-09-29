const TZ = "Asia/Jakarta";

export function formatDateId(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatTimeId(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatRange(start: string, end: string): string {
  return `${formatTimeId(start)} – ${formatTimeId(end)} WIB`;
}

/** YYYY-MM-DD in Jakarta calendar */
export function toDateInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function dayBoundsUtc(dateInput: string): { from: Date; to: Date } {
  const from = new Date(`${dateInput}T00:00:00+07:00`);
  const to = new Date(`${dateInput}T23:59:59.999+07:00`);
  return { from, to };
}

export const OPERATING_HOURS = {
  start: 7,
  end: 22,
} as const;
