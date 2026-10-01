"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, type Room } from "@/lib/client-api";
import { formatAmenities, roomDetailHref } from "@/lib/room-display";
import { buttonClass } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { EmptyState } from "./ui/EmptyState";
import { ListLoadError } from "./ui/ListLoadError";
import { PageHeader } from "./ui/PageHeader";
import { LoadingBlock } from "./ui/LoadingBlock";

export function RoomDirectory() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const res = await apiFetch<{ rooms: Room[] }>("/api/v1/rooms");
      setRooms(res.rooms);
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

  return (
    <div className="page-content">
      <PageHeader
        title="Daftar ruang"
        description="Kapasitas, lantai, dan fasilitas."
        actions={
          <Link href="/book" className="btn btn-primary">
            Booking ruang
          </Link>
        }
      />

      {unauthorized && error && (
        <Alert variant="error">{error}</Alert>
      )}

      {!unauthorized && error && !loading && (
        <ListLoadError message={error} onRetry={load} bookLabel="Ke kalender booking" />
      )}

      {loading && <LoadingBlock />}

      {!loading && !error && rooms.length === 0 && (
        <EmptyState bookLabel="Ke kalender booking">
          <p>Belum ada ruang aktif.</p>
        </EmptyState>
      )}

      {!loading && !error && rooms.length > 0 && (
        <ul className="room-list">
          {rooms.map((room) => (
            <li key={room.id} className="room-card">
              <div>
                <h3>
                  <Link href={roomDetailHref(room.code)} className="room-card-title-link">
                    {room.name}
                  </Link>
                </h3>
                <p className="text-muted">
                  Kode {room.code} · Lantai {room.floor ?? "—"} · {room.capacity}{" "}
                  orang
                </p>
                <p className="text-muted">
                  Fasilitas: {formatAmenities(room.amenities)}
                </p>
              </div>
              <div className="room-card-actions">
                <Link
                  href={roomDetailHref(room.code)}
                  className={buttonClass({ variant: "secondary", size: "sm" })}
                >
                  Detail
                </Link>
                <Link
                  href={`/book?room=${room.id}`}
                  className={buttonClass({ variant: "primary", size: "sm" })}
                >
                  Pesan ruang
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
