import { describe, expect, it } from "vitest";
import {
  formatAmenities,
  normalizeRoomCodeParam,
  roomDetailHref,
  sortRoomsByCode,
} from "./room-display";
import type { Room } from "@/lib/client-api";

const sample: Room[] = [
  {
    id: "e",
    code: "MR-E",
    name: "Boardroom",
    floor: "5",
    capacity: 10,
    amenities: ["vc"],
  },
  {
    id: "a",
    code: "MR-A",
    name: "Executive",
    floor: "3",
    capacity: 8,
    amenities: [],
  },
];

describe("room-display", () => {
  it("sortRoomsByCode orders MR-A before MR-E", () => {
    expect(sortRoomsByCode(sample).map((r) => r.code)).toEqual(["MR-A", "MR-E"]);
  });

  it("formatAmenities joins amenities", () => {
    expect(formatAmenities(["tv", "whiteboard"])).toBe("tv · whiteboard");
  });

  it("normalizeRoomCodeParam uppercases and trims", () => {
    expect(normalizeRoomCodeParam(" mr-a ")).toBe("MR-A");
    expect(normalizeRoomCodeParam("mr%2Db")).toBe("MR-B");
  });

  it("roomDetailHref encodes code in path", () => {
    expect(roomDetailHref("MR-A")).toBe("/rooms/MR-A");
  });
});
