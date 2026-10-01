import { formatRange } from "@/lib/format";
import { organizerDisplayName } from "@/lib/calendar-agenda";

export function SlotOccupancy({
  title,
  organizerName,
}: {
  title: string;
  organizerName: string;
}) {
  const organizer = organizerDisplayName(organizerName);
  return (
    <>
      <span className="slot-title" title={title}>
        {title}
      </span>
      <span className="slot-organizer" title={`Organizer: ${organizer}`}>
        {organizer}
      </span>
    </>
  );
}

export type AgendaRow = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  organizerName: string;
};

export function RoomDayAgenda({ bookings }: { bookings: readonly AgendaRow[] }) {
  if (bookings.length === 0) {
    return (
      <p className="agenda-empty text-muted">Tidak ada booking pada tanggal ini.</p>
    );
  }

  return (
    <ul className="agenda-list">
      {bookings.map((booking) => {
        const organizer = organizerDisplayName(booking.organizerName);
        return (
          <li key={booking.id} className="agenda-item">
            <span className="agenda-time">{formatRange(booking.startAt, booking.endAt)}</span>
            <span className="agenda-title">{booking.title}</span>
            <span className="agenda-organizer">Organizer: {organizer}</span>
          </li>
        );
      })}
    </ul>
  );
}
