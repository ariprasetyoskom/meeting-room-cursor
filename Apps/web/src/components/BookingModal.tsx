"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/client-api";
import type { Room } from "@/lib/client-api";
import { formatDateId } from "@/lib/format";

type Props = {
  open: boolean;
  room: Room | null;
  rooms?: Room[];
  date: string;
  startHour: number;
  endHour: number;
  onClose: () => void;
  onSuccess: () => void;
};

function toOffsetIso(date: string, hour: number, minute = 0): string {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${date}T${h}:${m}:00+07:00`;
}

export function BookingModal({
  open,
  room,
  rooms = [],
  date,
  startHour,
  endHour,
  onClose,
  onSuccess,
}: Props) {
  const [roomId, setRoomId] = useState(room?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState(startHour);
  const [end, setEnd] = useState(endHour);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<
    Array<{ title: string; organizerName: string; startAt: string; endAt: string }>
  >([]);

  useEffect(() => {
    if (open) {
      setStart(startHour);
      setEnd(endHour);
      setError(null);
      setConflicts([]);
      if (room) setRoomId(room.id);
    }
  }, [open, startHour, endHour, room]);

  const activeRoom =
    rooms.find((r) => r.id === roomId) ?? room;

  if (!open || !activeRoom) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConflicts([]);
    const submitRoom =
      rooms.find((r) => r.id === roomId) ?? room;
    if (!submitRoom) return;

    try {
      await apiFetch("/api/v1/bookings", {
        method: "POST",
        body: JSON.stringify({
          roomId: submitRoom.id,
          title,
          description: description || undefined,
          startAt: toOffsetIso(date, start),
          endAt: toOffsetIso(date, end),
        }),
      });
      onSuccess();
      onClose();
      setTitle("");
      setDescription("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const details = err.body.details as
          | { conflicts?: typeof conflicts }
          | undefined;
        if (details?.conflicts) setConflicts(details.conflicts);
      } else {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="booking-modal-title"
      >
        <h2 id="booking-modal-title">Booking — {activeRoom.name}</h2>
        <p className="text-muted">{formatDateId(`${date}T12:00:00+07:00`)}</p>
        <form onSubmit={handleSubmit} className="form-stack">
          {rooms.length > 1 && (
            <label>
              Ruangan *
              <select
                className="input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.capacity} orang)
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Judul meeting *
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={120}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Mulai (jam)
              <select
                className="input"
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
              >
                {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
            <label>
              Selesai (jam)
              <select
                className="input"
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
              >
                {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Deskripsi
            <textarea
              className="input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </label>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
              {conflicts.length > 0 && (
                <ul className="conflict-list">
                  {conflicts.map((c, i) => (
                    <li key={i}>
                      {c.title} — {c.organizerName} (
                      {new Date(c.startAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                      })}
                      )
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Menyimpan…" : "Konfirmasi booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
