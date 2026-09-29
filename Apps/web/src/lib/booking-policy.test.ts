import { describe, expect, it } from "vitest";
import {
  assertCanCancel,
  assertBookingWindow,
  PolicyError,
} from "./booking-policy";

describe("assertBookingWindow", () => {
  it("rejects booking too soon", () => {
    const now = new Date("2026-10-01T08:00:00+07:00");
    const start = new Date("2026-10-01T08:10:00+07:00");
    const end = new Date("2026-10-01T09:00:00+07:00");
    expect(() => assertBookingWindow(start, end, now)).toThrow(PolicyError);
  });
});

describe("assertCanCancel", () => {
  it("allows admin regardless of window", () => {
    const start = new Date(Date.now() + 30 * 60 * 1000);
    expect(() =>
      assertCanCancel(start, { id: "a", role: "admin" }, "other"),
    ).not.toThrow();
  });

  it("blocks employee cancel inside cutoff window", () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    expect(() =>
      assertCanCancel(start, { id: "u1", role: "employee" }, "u1"),
    ).toThrow(PolicyError);
  });
});
