"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  apiFetch,
  type BookingRow,
  type Room,
} from "@/lib/client-api";
import { BookingModal } from "./BookingModal";
import { RoomDayAgenda, SlotOccupancy } from "./calendar-readout";
import { RoomPicker } from "./RoomPicker";
import { PageHeader } from "./ui/PageHeader";
import { LoadingBlock } from "./ui/LoadingBlock";
import { Button } from "./ui/Button";
import {
  agendaForRooms,
  bookingCoversSlot,
  occupiedSlotLabel,
  occupancySpan,
} from "@/lib/calendar-agenda";
import {
  OPERATING_HOURS,
  addDaysToDateInput,
  dayBoundsUtc,
  formatDateId,
  formatDayMonthShort,
  formatWeekdayShort,
  toDateInputValue,
  weekBoundsUtc,
  weekDayDates,
  weekStartMonday,
  isBookingSlotPast,
} from "@/lib/format";
import {
  DEV_AUTH_READY_EVENT,
  ensureDevUserId,
} from "@/lib/dev-auth-client";

type ViewMode = "timeline" | "week" | "list";

export function BookingCalendar() {
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [view, setView] = useState<ViewMode>("timeline");
  const [minCapacity, setMinCapacity] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    room: Room;
    startHour: number;
    endHour: number;
  } | null>(null);
  const [now, setNow] = useState(() => new Date());

  const visibleRooms = useMemo(() => {
    if (!selectedRoomId) return rooms;
    return rooms.filter((r) => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

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
      await ensureDevUserId();
      const { from, to } =
        view === "week" ? weekBoundsUtc(date) : dayBoundsUtc(date);
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
  }, [date, minCapacity, view]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onDevAuth = () => load();
    window.addEventListener(DEV_AUTH_READY_EVENT, onDevAuth);
    return () => window.removeEventListener(DEV_AUTH_READY_EVENT, onDevAuth);
  }, [load]);

  useEffect(() => {
    if (view === "week" && !selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [view, selectedRoomId, rooms]);

  const weekMonday = useMemo(() => weekStartMonday(date), [date]);
  const weekDays = useMemo(() => weekDayDates(weekMonday), [weekMonday]);

  const weekRoom = useMemo(() => {
    if (selectedRoomId) {
      return rooms.find((r) => r.id === selectedRoomId) ?? null;
    }
    return rooms[0] ?? null;
  }, [rooms, selectedRoomId]);

  function bookingsForRoom(roomId: string) {
    return bookings.filter((b) => b.roomId === roomId);
  }

  function bookingAtSlot(roomId: string, dayYmd: string, hour: number) {
    return bookingsForRoom(roomId).find((booking) =>
      bookingCoversSlot(booking, dayYmd, hour),
    );
  }

  function spanAt(roomId: string, dayYmd: string, hour: number) {
    return occupancySpan(
      hours,
      hour,
      (candidate) => bookingAtSlot(roomId, dayYmd, candidate)?.id ?? null,
    );
  }

  function openBook(room: Room, dayYmd: string, hour: number) {
    setDate(dayYmd);
    setModal({ room, startHour: hour, endHour: Math.min(hour + 1, 22) });
  }

  function shiftWeek(deltaDays: number) {
    setDate(addDaysToDateInput(date, deltaDays));
  }

  return (
    <div className="page-content booking-page">
      <PageHeader
        title="Booking ruang"
        description="Pilih tanggal dan slot kosong — target ≤ 2 menit."
      />

      {!loading && !error && rooms.length > 0 && (
        <RoomPicker
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelect={setSelectedRoomId}
        />
      )}

      <div className="toolbar booking-toolbar">
        <div className="toolbar-cluster">
          <label className="toolbar-item">
            {view === "week" ? "Minggu (tanggal acuan)" : "Tanggal"}
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {view === "week" && (
            <div className="toolbar-item">
              <span>Navigasi</span>
              <div className="week-nav" role="group" aria-label="Navigasi minggu">
                <Button variant="secondary" size="sm" onClick={() => shiftWeek(-7)}>
                  ← Minggu lalu
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDate(toDateInputValue(new Date()))}
                >
                  Minggu ini
                </Button>
                <Button variant="secondary" size="sm" onClick={() => shiftWeek(7)}>
                  Minggu depan →
                </Button>
              </div>
            </div>
          )}
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
        </div>
        <div className="toolbar-cluster toolbar-cluster-end">
          <div className="toolbar-item">
            <span id="calendar-view-label">Tampilan</span>
            <div
              className="segmented"
              role="group"
              aria-labelledby="calendar-view-label"
            >
              <button
                type="button"
                className={view === "timeline" ? "active" : ""}
                aria-pressed={view === "timeline"}
                onClick={() => setView("timeline")}
              >
                Hari
              </button>
              <button
                type="button"
                className={view === "week" ? "active" : ""}
                aria-pressed={view === "week"}
                onClick={() => setView("week")}
              >
                Minggu
              </button>
              <button
                type="button"
                className={view === "list" ? "active" : ""}
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                Daftar
              </button>
            </div>
          </div>
          <div className="toolbar-item">
            <span aria-hidden="true">&nbsp;</span>
            <Button variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <p className="text-muted date-label">
        {view === "week"
          ? `Minggu ${formatDayMonthShort(weekMonday)} – ${formatDayMonthShort(weekDays[6])} ${new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", year: "numeric" }).format(new Date(`${weekDays[6]}T12:00:00+07:00`))}`
          : formatDateId(`${date}T12:00:00+07:00`)}
      </p>
      {view === "week" && weekRoom && (
        <p className="text-muted week-room-label">
          Tampilan minggu: <strong>{weekRoom.name}</strong> — pilih kartu ruang di atas
          untuk ganti.
        </p>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="calendar-loading panel">
          <LoadingBlock label="Memuat kalender…" />
        </div>
      )}

      {!loading && !error && rooms.length === 0 && (
        <div className="empty-state">
          <p>Tidak ada ruang yang cocok.</p>
          <button type="button" className="btn btn-link" onClick={() => setMinCapacity("")}>
            Reset filter
          </button>
        </div>
      )}

      {!loading && view === "list" && visibleRooms.length > 0 && (
        <ul className="room-list">
          {visibleRooms.map((room) => (
            <li key={room.id} className="room-card room-card-agenda">
              <div className="room-card-main">
                <h3>{room.name}</h3>
                <p className="text-muted">
                  Lantai {room.floor ?? "—"} · {room.capacity} orang ·{" "}
                  {(room.amenities ?? []).join(", ") || "—"}
                </p>
              </div>
              <Button variant="primary" onClick={() => openBook(room, date, 9)}>
                Pesan ruang
              </Button>
              <RoomDayAgenda bookings={agendaForRooms(bookings, [room.id])} />
            </li>
          ))}
        </ul>
      )}

      {!loading && view === "week" && weekRoom && (
        <div
          className="timeline-wrap week-wrap"
          tabIndex={0}
          role="region"
          aria-label="Kalender minggu. Gulir untuk melihat jam dan hari."
        >
          <table className="timeline-table week-table">
            <thead>
              <tr>
                <th className="week-corner">Jam</th>
                {weekDays.map((dayYmd) => (
                  <th key={dayYmd} className="week-day-head">
                    <span>{formatWeekdayShort(dayYmd)}</span>
                    <small>{formatDayMonthShort(dayYmd)}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h}>
                  <th scope="row" className="timeline-hour">
                    {String(h).padStart(2, "0")}
                  </th>
                  {weekDays.map((dayYmd) => {
                    const span = spanAt(weekRoom.id, dayYmd, h);
                    if (span === "skip") return null;
                    const occupied = bookingAtSlot(weekRoom.id, dayYmd, h);
                    if (occupied && typeof span === "number") {
                      return (
                        <td
                          key={dayYmd}
                          rowSpan={span}
                          className="slot slot-busy"
                          aria-label={occupiedSlotLabel(
                            occupied.title,
                            occupied.organizerName,
                          )}
                        >
                          <SlotOccupancy
                            title={occupied.title}
                            organizerName={occupied.organizerName}
                          />
                        </td>
                      );
                    }
                    const past = isBookingSlotPast(dayYmd, h, now);
                    return (
                      <td key={dayYmd}>
                        <button
                          type="button"
                          className={`slot slot-free${past ? " slot-past" : ""}`}
                          disabled={past}
                          aria-label={`Booking ${weekRoom.name} ${dayYmd} jam ${h}`}
                          aria-disabled={past}
                          onClick={() => openBook(weekRoom, dayYmd, h)}
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

      {!loading && view === "timeline" && visibleRooms.length > 0 && (
        <div
          className="timeline-wrap"
          tabIndex={0}
          role="region"
          aria-label="Kalender hari. Gulir mendatar untuk melihat jam."
        >
          <table className="timeline-table day-timeline">
            <thead>
              <tr>
                <th>Ruang</th>
                {hours.map((h) => (
                  <th key={h}>{String(h).padStart(2, "0")}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRooms.map((room) => (
                <tr key={room.id}>
                  <th scope="row" className="timeline-room">
                    <span>{room.name}</span>
                    <small>{room.capacity} pax</small>
                  </th>
                  {hours.map((h) => {
                    const span = spanAt(room.id, date, h);
                    if (span === "skip") return null;
                    const occupied = bookingAtSlot(room.id, date, h);
                    if (occupied && typeof span === "number") {
                      return (
                        <td
                          key={h}
                          colSpan={span}
                          className="slot slot-busy"
                          aria-label={occupiedSlotLabel(
                            occupied.title,
                            occupied.organizerName,
                          )}
                        >
                          <SlotOccupancy
                            title={occupied.title}
                            organizerName={occupied.organizerName}
                          />
                        </td>
                      );
                    }
                    const past = isBookingSlotPast(date, h, now);
                    return (
                      <td key={h}>
                        <button
                          type="button"
                          className={`slot slot-free${past ? " slot-past" : ""}`}
                          disabled={past}
                          aria-label={`Booking ${room.name} jam ${h}`}
                          aria-disabled={past}
                          onClick={() => openBook(room, date, h)}
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
        rooms={rooms}
        date={date}
        startHour={modal?.startHour ?? 9}
        endHour={modal?.endHour ?? 10}
        onClose={() => setModal(null)}
        onSuccess={load}
      />
    </div>
  );
}
