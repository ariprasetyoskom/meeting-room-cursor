"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  apiFetch,
  type BookingRow,
  type Room,
} from "@/lib/client-api";
import { formatDateId, formatRange, toDateInputValue } from "@/lib/format";
import { Alert } from "./ui/Alert";
import { PageHeader } from "./ui/PageHeader";
import { LoadingBlock } from "./ui/LoadingBlock";

export function AdminBookingsList() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"" | "confirmed" | "cancelled">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
      setSuccess(null);
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

  const filterSummary = [
    from && to
      ? `Rentang ${formatDateId(`${from}T12:00:00+07:00`)} – ${formatDateId(`${to}T12:00:00+07:00`)}`
      : null,
    status === "confirmed"
      ? "Status: confirmed"
      : status === "cancelled"
        ? "Status: cancelled"
        : "Status: semua",
  ]
    .filter(Boolean)
    .join(" · ");

  async function confirmCancel() {
    if (!cancelId || !cancelReason.trim()) {
      setSuccess(null);
      setError("Alasan wajib untuk pembatalan admin (BR-08).");
      return;
    }
    setCancelling(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/api/v1/bookings/${cancelId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      setCancelId(null);
      setCancelReason("");
      setSuccess("Booking dibatalkan. Entri audit tercatat.");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Pembatalan gagal.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Semua booking"
        description="Lihat semua reservasi; batalkan sebagai admin dengan alasan (F-09)."
      />

      <div className="toolbar">
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
        {filterSummary ? (
          <p className="toolbar-summary">{filterSummary}</p>
        ) : null}
      </div>

      {error && (
        <Alert variant="error" className="admin-feedback-alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="admin-feedback-alert">
          {success}
        </Alert>
      )}

      {loading && <LoadingBlock />}

      {!loading && bookings.length === 0 && (
        <div className="empty-state">
          <p>Tidak ada booking untuk filter ini.</p>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table data-table-compact admin-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Ruang</th>
                <th>Waktu (WIB)</th>
                <th>Organizer</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td>{rooms[b.roomId]?.name ?? b.roomId.slice(0, 8)}</td>
                  <td>
                    {formatDateId(b.startAt)}
                    <br />
                    <span className="text-muted">{formatRange(b.startAt, b.endAt)}</span>
                  </td>
                  <td>{b.organizerName}</td>
                  <td>
                    <span
                      className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-muted"}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="admin-table-actions">
                    {b.status === "confirmed" ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setCancelId(b.id);
                          setCancelReason("");
                        }}
                      >
                        Batalkan
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelId && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog">
            <h2>Batalkan booking</h2>
            <p className="text-muted">Alasan wajib untuk audit (D-1 / BR-08).</p>
            <div className="form-stack">
              <label>
                Alasan *
                <textarea
                  className="input"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCancelId(null)}
                disabled={cancelling}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? "Membatalkan…" : "Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
