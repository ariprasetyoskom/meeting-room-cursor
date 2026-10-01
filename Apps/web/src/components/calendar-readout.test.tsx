import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoomDayAgenda, SlotOccupancy } from "./calendar-readout";

describe("calendar readout", () => {
  it("renders the organizer name inside an occupied slot", () => {
    const html = renderToStaticMarkup(
      <SlotOccupancy title="Review desain" organizerName="Dewi Lestari" />,
    );
    expect(html).toContain("Review desain");
    expect(html).toContain("slot-organizer");
    expect(html).toContain("Dewi Lestari");
  });

  it("lists each booking with a visible organizer", () => {
    const html = renderToStaticMarkup(
      <RoomDayAgenda
        bookings={[
          {
            id: "1",
            title: "Standup",
            startAt: "2026-10-01T01:00:00.000Z",
            endAt: "2026-10-01T02:00:00.000Z",
            organizerName: "Ari Wijaya",
          },
        ]}
      />,
    );
    expect(html).toContain("Standup");
    expect(html).toContain("Organizer: Ari Wijaya");
    expect(html).toContain("agenda-organizer");
  });

  it("shows an empty state when the day has no bookings", () => {
    const html = renderToStaticMarkup(<RoomDayAgenda bookings={[]} />);
    expect(html).toContain("Tidak ada booking pada tanggal ini.");
  });
});
