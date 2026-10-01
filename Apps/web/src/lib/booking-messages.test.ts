import { describe, expect, it } from "vitest";
import {
  BOOKING_ROOM_CONFLICT_MESSAGE,
  bookingApiErrorMessage,
} from "./booking-messages";

describe("bookingApiErrorMessage", () => {
  it("maps ROOM_CONFLICT to PRD copy", () => {
    expect(bookingApiErrorMessage("ROOM_CONFLICT", "legacy")).toBe(
      BOOKING_ROOM_CONFLICT_MESSAGE,
    );
    expect(BOOKING_ROOM_CONFLICT_MESSAGE).toBe(
      "Ruangan sudah dipesan pada waktu ini.",
    );
  });

  it("passes through other codes", () => {
    expect(bookingApiErrorMessage("POLICY", "Aturan ditolak.")).toBe(
      "Aturan ditolak.",
    );
  });
});
