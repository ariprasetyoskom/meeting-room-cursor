"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  apiFetch,
  type BookingRow,
  type Room,
} from "@/lib/client-api";
import { formatDateId, formatRange } from "@/lib/format";
import { Alert } from "./ui/Alert";
import { EmptyState } from "./ui/EmptyState";
import { ListLoadError } from "./ui/ListLoadError";
import { PageHeader } from "./ui/PageHeader";
import { LoadingBlock } from "./ui/LoadingBlock";

type Tab = "upcoming" | "past";

export function MyBookingsList() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [rooms, setRooms] = useState<Record<string, Room>>({});
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const [meRes, bookingRes, roomRes] = await Promise.all([
        apiFetch<{ id: string }>("/api/v1/me"),
        apiFetch<{ bookings: BookingRow[] }>("/api/v1/bookings?mine=true"),
        apiFetch<{ rooms: Room[] }>("/api/v1/rooms"),
      ]);
      setMe(meRes);
      setBookings(bookingRes.bookings);
      setRooms(Object.fromEntries(roomRes.rooms.map((r) => [r.id, r])));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUnauthorized(true);
        setError("Silakan login di /login.");
      } else {
        setError(e instanceof Error ? e.message : "Gagal memuat.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const filtered = useMemo(() => {
    return bookings
      .filter((b) => {
        const start = new Date(b.startAt).getTime();
        if (tab === "upcoming") {
          return b.status === "confirmed" && start >= now;
        }
        return b.status === "cancelled" || start < now;
      })
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }, [bookings, tab, now]);

  async function confirmCancel() {
    if (!cancelId) return;
    try {
      await apiFetch(`/api/v1/bookings/${cancelId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });
      setCancelId(null);
      setCancelReason("");
      await load();
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Pembatalan gagal.";
      alert(msg);
    }
  }

  const emptyCopy =
    tab === "upcoming"
      ? "Belum ada booking mendatang — mulai dari kalender booking."
      : "Belum ada riwayat booking di tab ini.";

  return (
    <div className="page-content bookings-page">
      <PageHeader
        title="Booking saya"
        description="Mendatang dan riwayat reservasi Anda."
        actions={
          <Link href="/book" className="btn btn-primary">
            Booking baru
          </Link>
        }
      />

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upcoming"}
          className={tab === "upcoming" ? "active" : ""}
          onClick={() => setTab("upcoming")}
        >
          Mendatang
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "past"}
          className={tab === "past" ? "active" : ""}
          onClick={() => setTab("past")}
        >
          Riwayat
        </button>
      </div>

      {unauthorized && error && (
        <Alert variant="error">{error}</Alert>
      )}

      {!unauthorized && error && !loading && (
        <ListLoadError message={error} onRetry={load} bookLabel="Booking baru" />
      )}

      {loading && <LoadingBlock />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState bookLabel="Booking baru">
          <p>{emptyCopy}</p>
        </EmptyState>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="booking-cards">
          {filtered.map((b) => {
            const room = rooms[b.roomId];
            const isOrganizer = me?.id === b.organizerUserId;
            const canCancel =
              b.status === "confirmed" && isOrganizer && tab === "upcoming";
            return (
              <li key={b.id} className="booking-card-item">
                <div>
                  <h3>{b.title}</h3>
                  <p className="text-muted">
                    {room?.name ?? "Ruang"} · {formatDateId(b.startAt)} ·{" "}
                    {formatRange(b.startAt, b.endAt)}
                  </p>
                  <p className="text-muted">
                    Organizer: <strong>{b.organizerName}</strong>
                    {b.status === "cancelled" && " · Dibatalkan"}
                  </p>
                </div>
                {canCancel && (
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => setCancelId(b.id)}
                  >
                    Batalkan
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {cancelId && (
        <div className="modal-backdrop" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Batalkan booking?</h2>
            <p className="text-muted">
              Hanya organizer yang dapat membatalkan. Window cutoff 2 jam sebelum
              start (kecuali admin).
            </p>
            <div className="form-stack">
              <label>
                Alasan (opsional)
                <input
                  className="input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setCancelId(null)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmCancel}
              >
                Ya, batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
