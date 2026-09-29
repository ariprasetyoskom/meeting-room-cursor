"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  apiFetch,
  type BookingRow,
  type Room,
} from "@/lib/client-api";
import { formatDateId, formatRange, toDateInputValue } from "@/lib/format";

export function AdminBookingsList() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"" | "confirmed" | "cancelled">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", `${from}T00:00:00+07:00`);
      if (to) params.set("to", `${to}T23:59:59+07:00`);
      if (status) params.set("status", status);
      const q = params.toString();
      const [bookingRes, roomRes] = await Promise.all([
        apiFetch<{ bookings: BookingRow[] }>(
          `/api/v1/admin/bookings${q ? `?${q}` : ""}`,
        ),
        apiFetch<{ rooms: Room[] }>("/api/v1/admin/rooms"),
      ]);
      setBookings(bookingRes.bookings);
      setRooms(Object.fromEntries(roomRes.rooms.map((r) => [r.id, r])));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memuat booking.");
    } finally {
      setLoading(false);
    }
  }, [from, to, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setFrom(toDateInputValue(new Date()));
  }, []);

  async function confirmCancel() {
    if (!cancelId || !cancelReason.trim()) {
      setError("Alasan wajib untuk pembatalan admin (BR-08).");
      return;
    }
    try {
      await apiFetch(`/api/v1/bookings/${cancelId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      setCancelId(null);
      setCancelReason("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Pembatalan gagal.");
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Semua booking</h1>
          <p className="text-muted">Override cancel dengan alasan (F-09).</p>
        </div>
      </header>

      <div className="toolbar admin-filters">
        <label className="toolbar-item">
          Dari
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="toolbar-item">
          Sampai
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="toolbar-item">
          Status
          <select
            className="input"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "" | "confirmed" | "cancelled")
            }
          >
            <option value="">Semua</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <button type="button" className="btn btn-secondary" onClick={load}>
          Terapkan
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="text-muted">Memuat…</p>}

      {!loading && (
        <ul className="booking-cards">
          {bookings.map((b) => (
            <li key={b.id} className="booking-card-item">
              <div>
                <h3>{b.title}</h3>
                <p className="text-muted">
                  {rooms[b.roomId]?.name ?? b.roomId} ·{" "}
                  {formatDateId(b.startAt)} · {formatRange(b.startAt, b.endAt)}
                </p>
                <p className="text-muted">
                  Organizer: {b.organizerName} ·{" "}
                  <span
                    className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-muted"}`}
                  >
                    {b.status}
                  </span>
                </p>
              </div>
              {b.status === "confirmed" && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setCancelId(b.id);
                    setCancelReason("");
                  }}
                >
                  Batalkan (admin)
                </button>
              )}
            </li>
          ))}
          {bookings.length === 0 && (
            <p className="text-muted">Tidak ada booking untuk filter ini.</p>
          )}
        </ul>
      )}

      {cancelId && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog">
            <h2>Batalkan booking</h2>
            <p className="text-muted">Alasan wajib untuk audit (D-1 / BR-08).</p>
            <label className="form-stack">
              Alasan *
              <textarea
                className="input"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelId(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmCancel}
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
