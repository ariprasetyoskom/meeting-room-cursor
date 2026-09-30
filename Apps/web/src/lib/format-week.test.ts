import { describe, expect, it } from "vitest";
import {
  addDaysToDateInput,
  weekBoundsUtc,
  weekDayDates,
  weekStartMonday,
} from "./format";

describe("week calendar helpers", () => {
  it("finds Monday for a Wednesday", () => {
    expect(weekStartMonday("2026-09-30")).toBe("2026-09-28");
  });

  it("returns 7 consecutive days from Monday", () => {
    expect(weekDayDates("2026-09-28")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("week bounds cover Mon 00:00 to Sun end WIB", () => {
    const { from, to } = weekBoundsUtc("2026-09-30");
    expect(from.toISOString()).toBe(new Date("2026-09-28T00:00:00+07:00").toISOString());
    expect(to.toISOString()).toBe(
      new Date("2026-10-04T23:59:59.999+07:00").toISOString(),
    );
  });

  it("addDaysToDateInput crosses month boundary", () => {
    expect(addDaysToDateInput("2026-09-30", 1)).toBe("2026-10-01");
  });
});
