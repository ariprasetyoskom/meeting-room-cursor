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

/** Shift calendar date (Jakarta) by N days; returns YYYY-MM-DD */
export function addDaysToDateInput(dateInput: string, days: number): string {
  const ms = new Date(`${dateInput}T12:00:00+07:00`).getTime();
  return toDateInputValue(new Date(ms + days * 86_400_000));
}

/** Monday YYYY-MM-DD (week starts Monday) for the week containing dateInput */
export function weekStartMonday(dateInput: string): string {
  let current = dateInput;
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${current}T12:00:00+07:00`);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      weekday: "short",
    }).format(d);
    if (weekday === "Mon") return current;
    current = addDaysToDateInput(current, -1);
  }
  return dateInput;
}

export function weekDayDates(mondayYmd: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToDateInput(mondayYmd, i));
}

export function weekBoundsUtc(anchorDateInput: string): { from: Date; to: Date } {
  const monday = weekStartMonday(anchorDateInput);
  const sunday = addDaysToDateInput(monday, 6);
  return {
    from: new Date(`${monday}T00:00:00+07:00`),
    to: new Date(`${sunday}T23:59:59.999+07:00`),
  };
}

export function formatWeekdayShort(dateInput: string): string {
  const d = new Date(`${dateInput}T12:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "short",
  }).format(d);
}

export function formatDayMonthShort(dateInput: string): string {
  const d = new Date(`${dateInput}T12:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  }).format(d);
}

export const OPERATING_HOURS = {
  start: 7,
  end: 22,
} as const;
