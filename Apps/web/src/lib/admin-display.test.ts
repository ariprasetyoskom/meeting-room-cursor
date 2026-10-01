import { describe, expect, it } from "vitest";
import { formatAuditAction, formatAuditPayload } from "./admin-display";

describe("formatAuditAction", () => {
  it("maps known audit actions", () => {
    expect(formatAuditAction("BOOKING_CREATED")).toBe("Booking dibuat");
    expect(formatAuditAction("ROOM_DEACTIVATED")).toBe("Ruang dinonaktifkan");
  });

  it("falls back for unknown actions", () => {
    expect(formatAuditAction("CUSTOM_EVENT")).toBe("custom event");
  });
});

describe("formatAuditPayload", () => {
  it("stringifies objects and truncates long JSON", () => {
    const long = { a: "x".repeat(200) };
    const out = formatAuditPayload(long);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(120);
  });

  it("returns dash for nullish", () => {
    expect(formatAuditPayload(null)).toBe("—");
  });
});
