"use client";

import type { Room } from "@/lib/client-api";

type Props = {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (roomId: string | null) => void;
};

export function RoomPicker({ rooms, selectedRoomId, onSelect }: Props) {
  if (rooms.length === 0) return null;

  return (
    <section className="room-picker" aria-label="Pilih ruangan">
      <div className="room-picker-header">
        <h2 className="room-picker-title">Pilih ruangan</h2>
        <span className="text-muted">{rooms.length} ruang tersedia</span>
      </div>
      <div className="room-picker-grid" role="listbox" aria-label="Daftar ruang">
        <button
          type="button"
          role="option"
          aria-selected={selectedRoomId === null}
          className={`room-picker-card ${selectedRoomId === null ? "selected" : ""}`}
          onClick={() => onSelect(null)}
        >
          <strong>Semua ruang</strong>
          <span className="text-muted">Lihat timeline lengkap</span>
        </button>
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            role="option"
            aria-selected={selectedRoomId === room.id}
            className={`room-picker-card ${selectedRoomId === room.id ? "selected" : ""}`}
            onClick={() => onSelect(room.id)}
          >
            <strong>{room.name}</strong>
            <span className="text-muted">
              Lantai {room.floor ?? "—"} · {room.capacity} orang
            </span>
            <span className="room-picker-amenities">
              {room.amenities?.join(" · ") || "—"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
