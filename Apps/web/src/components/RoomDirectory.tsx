"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, type Room } from "@/lib/client-api";

export function RoomDirectory() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ rooms: Room[] }>("/api/v1/rooms")
      .then((res) => setRooms(res.rooms))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setError("Silakan login di /login.");
        } else {
          setError(e instanceof Error ? e.message : "Gagal memuat.");
        }
      });
  }, []);

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Daftar ruang</h1>
          <p className="text-muted">Kapasitas, lantai, dan fasilitas.</p>
        </div>
        <Link href="/book" className="btn btn-primary">
          Booking ruang
        </Link>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

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
    </div>
  );
}
