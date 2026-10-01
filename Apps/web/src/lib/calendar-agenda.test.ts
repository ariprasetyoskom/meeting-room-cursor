import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  agendaForRooms,
  bookingCoversSlot,
  occupancySpan,
  occupiedSlotLabel,
  organizerDisplayName,
} from "./calendar-agenda";

const hours = [7, 8, 9, 10, 11];

describe("organizer display", () => {
  it("keeps a non-empty organizer label", () => {
    expect(organizerDisplayName("  Siti   Rahayu ")).toBe("Siti Rahayu");
    expect(organizerDisplayName("")).toBe("—");
    expect(organizerDisplayName(null)).toBe("—");
    expect(organizerDisplayName("   ")).toBe("—");
  });

  it("includes organizer in the slot accessible name", () => {
    expect(occupiedSlotLabel("Sprint", "Budi Santoso")).toBe(
      "Sprint. Organizer Budi Santoso",
    );
  });
});

describe("agendaForRooms", () => {
  const rows = [
    {
      id: "b",
      roomId: "room-a",
      startAt: "2026-10-01T04:00:00.000Z",
      status: "confirmed" as const,
    },
    {
      id: "a",
      roomId: "room-a",
      startAt: "2026-10-01T02:00:00.000Z",
      status: "confirmed" as const,
    },
    {
      id: "c",
      roomId: "room-b",
      startAt: "2026-10-01T01:00:00.000Z",
      status: "confirmed" as const,
    },
    {
      id: "d",
      roomId: "room-a",
      startAt: "2026-10-01T03:00:00.000Z",
      status: "cancelled" as const,
    },
  ];

  it("filters to visible rooms, drops cancelled, and sorts by start", () => {
    expect(agendaForRooms(rows, ["room-a"]).map((row) => row.id)).toEqual(["a", "b"]);
  });
});

describe("occupancySpan", () => {
  const ids: Record<number, string | null> = {
    7: null,
    8: "meet-1",
    9: "meet-1",
    10: "meet-2",
    11: null,
  };

  it("detects WIB slot overlap", () => {
    const booking = {
      startAt: "2026-10-01T02:30:00.000Z",
      endAt: "2026-10-01T04:00:00.000Z",
    };
    expect(bookingCoversSlot(booking, "2026-10-01", 9)).toBe(true);
    expect(bookingCoversSlot(booking, "2026-10-01", 10)).toBe(true);
    expect(bookingCoversSlot(booking, "2026-10-01", 11)).toBe(false);
  });

  it("merges consecutive hours of the same booking and skips the tail", () => {
    const at = (hour: number) => ids[hour] ?? null;
    expect(occupancySpan(hours, 7, at)).toBe("free");
    expect(occupancySpan(hours, 8, at)).toBe(2);
    expect(occupancySpan(hours, 9, at)).toBe("skip");
    expect(occupancySpan(hours, 10, at)).toBe(1);
  });
});

describe("booking calendar css contract", () => {
  const css = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../app/globals.css"),
    "utf8",
  );

  it("scrolls the week grid and keeps the hour column sticky", () => {
    expect(css).toMatch(/\.week-wrap\s*\{[^}]*overflow:\s*auto/);
    expect(css).toMatch(/\.week-table \.timeline-hour\s*\{[^}]*position:\s*sticky/);
    expect(css).toMatch(/\.week-table thead th\s*\{[^}]*position:\s*sticky/);
  });

  it("keeps organizer text in the document flow", () => {
    expect(css).toMatch(/\.slot-organizer\s*\{[^}]*display:\s*block/);
    expect(css).not.toMatch(/\.slot-organizer\s*\{[^}]*display:\s*none/);
  });
});
