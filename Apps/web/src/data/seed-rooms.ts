/** Master list ruang meeting demo (5 ruang) — dipakai seed & referensi UI */
export const SEED_ROOMS = [
  {
    code: "MR-A",
    name: "Ruang Executive A",
    floor: "3",
    capacity: 8,
    amenities: ["tv", "whiteboard"],
  },
  {
    code: "MR-B",
    name: "Ruang Focus B",
    floor: "3",
    capacity: 4,
    amenities: ["vc"],
  },
  {
    code: "MR-C",
    name: "Ruang Townhall C",
    floor: "4",
    capacity: 12,
    amenities: ["tv", "vc", "whiteboard"],
  },
  {
    code: "MR-D",
    name: "Ruang Creative D",
    floor: "4",
    capacity: 6,
    amenities: ["tv", "whiteboard"],
  },
  {
    code: "MR-E",
    name: "Ruang Boardroom E",
    floor: "5",
    capacity: 10,
    amenities: ["vc", "whiteboard", "phone"],
  },
] as const;
