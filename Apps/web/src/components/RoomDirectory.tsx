"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, type Room } from "@/lib/client-api";
import { PageHeader } from "./ui/PageHeader";
import { LoadingBlock } from "./ui/LoadingBlock";

export function RoomDirectory() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ rooms: Room[] }>("/api/v1/rooms")
      .then((res) => setRooms(res.rooms))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setError("Silakan login di /login.");
        } else {
          setError(e instanceof Error ? e.message : "Gagal memuat.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

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

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && <LoadingBlock />}

      {!loading && rooms.length === 0 && !error && (
        <div className="empty-state">
          <p>Belum ada ruang aktif.</p>
          <Link href="/book" className="btn btn-primary">
            Ke kalender booking
          </Link>
        </div>
      )}

      {!loading && (
      <ul className="room-list">
        {rooms.map((room) => (
          <li key={room.id} className="room-card">
            <div>
              <h3>{room.name}</h3>
              <p className="text-muted">
                Kode {room.code} · Lantai {room.floor ?? "—"} · {room.capacity}{" "}
                orang
              </p>
              <p className="text-muted">
                Fasilitas: {room.amenities?.join(", ") || "—"}
              </p>
            </div>
            <Link href={`/book?room=${room.id}`} className="btn btn-secondary">
              Lihat kalender
            </Link>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
