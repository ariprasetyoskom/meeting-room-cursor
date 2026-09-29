export function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getOptionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const bookingConfig = {
  minLeadMinutes: Number(
    getOptionalEnv("BOOKING_MIN_LEAD_MINUTES", "15"),
  ),
  cancelWindowHours: Number(
    getOptionalEnv("BOOKING_CANCEL_WINDOW_HOURS", "2"),
  ),
  minDurationMinutes: 30,
  maxDurationHours: 8,
};
