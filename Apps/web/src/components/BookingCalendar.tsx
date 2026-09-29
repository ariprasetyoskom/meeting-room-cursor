"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  apiFetch,
  type BookingRow,
  type Room,
} from "@/lib/client-api";
import { BookingModal } from "./BookingModal";
import {
  OPERATING_HOURS,
  dayBoundsUtc,
  formatDateId,
  toDateInputValue,
} from "@/lib/format";

type ViewMode = "timeline" | "list";

export function BookingCalendar() {
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [view, setView] = useState<ViewMode>("timeline");
  const [minCapacity, setMinCapacity] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    room: Room;
    startHour: number;
    endHour: number;
  } | null>(null);

  const hours = useMemo(
    () =>
      Array.from(
        { length: OPERATING_HOURS.end - OPERATING_HOURS.start },
        (_, i) => OPERATING_HOURS.start + i,
      ),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = dayBoundsUtc(date);
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const roomParams = new URLSearchParams();
      if (minCapacity) roomParams.set("minCapacity", minCapacity);

      const [roomRes, bookingRes] = await Promise.all([
        apiFetch<{ rooms: Room[] }>(`/api/v1/rooms?${roomParams}`),
        apiFetch<{ bookings: BookingRow[] }>(`/api/v1/bookings?${params}`),
      ]);
      setRooms(roomRes.rooms);
      setBookings(bookingRes.bookings);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Silakan login SSO di /login atau set Dev user ID (mode dev).");
      } else {
        setError(e instanceof Error ? e.message : "Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  }, [date, minCapacity]);

  useEffect(() => {
    load();
  }, [load]);

  function bookingsForRoom(roomId: string) {
    return bookings.filter((b) => b.roomId === roomId);
  }

  function bookingAtSlot(roomId: string, hour: number) {
    const slotStart = new Date(
      `${date}T${String(hour).padStart(2, "0")}:00:00+07:00`,
    );
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    return bookingsForRoom(roomId).find((b) => {
      const bStart = new Date(b.startAt);
      const bEnd = new Date(b.endAt);
      return bStart < slotEnd && bEnd > slotStart;
    });
  }

  function openBook(room: Room, hour: number) {
    setModal({ room, startHour: hour, endHour: Math.min(hour + 1, 22) });
  }

  return (
    <div className="booking-page">
      <header className="page-header">
        <div>
          <h1>Booking ruang</h1>
          <p className="text-muted">Pilih tanggal dan slot kosong — target ≤ 2 menit.</p>
        </div>
      </header>

      <div className="toolbar">
        <label className="toolbar-item">
          Tanggal
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="toolbar-item">
          Min. kapasitas
          <input
            type="number"
            min={1}
            className="input input-narrow"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            placeholder="Semua"
          />
        </label>
        <div className="segmented" role="group" aria-label="Tampilan">
          <button
            type="button"
            className={view === "timeline" ? "active" : ""}
            onClick={() => setView("timeline")}
          >
            Timeline
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            Daftar
          </button>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load}>
          Refresh
        </button>
      </div>

      <p className="text-muted date-label">{formatDateId(`${date}T12:00:00+07:00`)}</p>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="text-muted">Memuat…</p>}

      {!loading && !error && rooms.length === 0 && (
        <div className="empty-state">
          <p>Tidak ada ruang yang cocok.</p>
          <button type="button" className="btn btn-link" onClick={() => setMinCapacity("")}>
            Reset filter
          </button>
        </div>
      )}

      {!loading && view === "list" && rooms.length > 0 && (
        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.id} className="room-card">
              <div>
                <h3>{room.name}</h3>
                <p className="text-muted">
                  Lantai {room.floor ?? "—"} · {room.capacity} orang ·{" "}
                  {room.amenities.join(", ") || "—"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openBook(room, 9)}
              >
                Pesan ruang
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && view === "timeline" && rooms.length > 0 && (
        <div className="timeline-wrap">
          <table className="timeline-table">
            <thead>
              <tr>
                <th>Ruang</th>
                {hours.map((h) => (
                  <th key={h}>{String(h).padStart(2, "0")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <th scope="row" className="timeline-room">
                    <span>{room.name}</span>
                    <small>{room.capacity} pax</small>
                  </th>
                  {hours.map((h) => {
                    const occupied = bookingAtSlot(room.id, h);
                    if (occupied) {
                      return (
                        <td key={h} className="slot slot-busy">
                          <span className="slot-title" title={occupied.title}>
                            {occupied.title}
                          </span>
                          <span className="slot-organizer">{occupied.organizerName}</span>
                        </td>
                      );
                    }
                    return (
                      <td key={h}>
                        <button
                          type="button"
                          className="slot slot-free"
                          aria-label={`Booking ${room.name} jam ${h}`}
                          onClick={() => openBook(room, h)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BookingModal
        open={!!modal}
        room={modal?.room ?? null}
        date={date}
        startHour={modal?.startHour ?? 9}
        endHour={modal?.endHour ?? 10}
        onClose={() => setModal(null)}
        onSuccess={load}
      />
    </div>
  );
}
