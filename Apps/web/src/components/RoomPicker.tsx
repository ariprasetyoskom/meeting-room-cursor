"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import type { Room } from "@/lib/client-api";
import {
  formatAmenities,
  formatRoomMeta,
  roomOptionLabel,
  sortRoomsByCode,
} from "@/lib/room-display";

type Props = {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (roomId: string | null) => void;
};

type OptionKey = "all" | string;

function optionKeys(rooms: Room[]): OptionKey[] {
  return ["all", ...rooms.map((r) => r.id)];
}

export function RoomPicker({ rooms, selectedRoomId, onSelect }: Props) {
  const listboxId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => sortRoomsByCode(rooms), [rooms]);
  const keys = useMemo(() => optionKeys(sorted), [sorted]);

  const selectedKey: OptionKey =
    selectedRoomId === null ? "all" : selectedRoomId;

  const focusOption = useCallback(
    (key: OptionKey) => {
      const el = gridRef.current?.querySelector<HTMLElement>(
        `[data-room-option="${key}"]`,
      );
      el?.focus();
    },
    [],
  );

  const moveSelection = useCallback(
    (delta: number) => {
      const idx = keys.indexOf(selectedKey);
      if (idx < 0) return;
      const next = keys[(idx + delta + keys.length) % keys.length];
      if (next === "all") onSelect(null);
      else onSelect(next);
      requestAnimationFrame(() => focusOption(next));
    },
    [keys, selectedKey, onSelect, focusOption],
  );

  const handleListKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          moveSelection(1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          moveSelection(-1);
          break;
        case "Home":
          e.preventDefault();
          onSelect(null);
          focusOption("all");
          break;
        case "End": {
          e.preventDefault();
          const last = sorted[sorted.length - 1];
          if (last) {
            onSelect(last.id);
            focusOption(last.id);
          }
          break;
        }
        default:
          break;
      }
    },
    [moveSelection, onSelect, focusOption, sorted],
  );

  if (rooms.length === 0) return null;

  return (
    <section className="room-picker panel" aria-labelledby={`${listboxId}-label`}>
      <div className="room-picker-header">
        <h2 id={`${listboxId}-label`} className="section-title room-picker-title">
          Pilih ruangan
        </h2>
        <span className="text-muted">{rooms.length} ruang tersedia</span>
      </div>
      <div
        ref={gridRef}
        id={listboxId}
        className="room-picker-grid"
        role="listbox"
        aria-label="Daftar ruang meeting"
        aria-activedescendant={
          selectedKey === "all"
            ? `${listboxId}-opt-all`
            : `${listboxId}-opt-${selectedKey}`
        }
        onKeyDown={handleListKeyDown}
      >
        <button
          type="button"
          id={`${listboxId}-opt-all`}
          data-room-option="all"
          role="option"
          aria-selected={selectedRoomId === null}
          className={`room-picker-card room-picker-card-all ${selectedRoomId === null ? "selected" : ""}`}
          onClick={() => onSelect(null)}
        >
          <span className="room-picker-code room-picker-code-all">ALL</span>
          <strong className="room-picker-name">Semua ruang</strong>
          <span className="room-picker-desc text-muted">
            Timeline multi-ruang (Hari)
          </span>
        </button>
        {sorted.map((room) => {
          const selected = selectedRoomId === room.id;
          return (
            <button
              key={room.id}
              type="button"
              id={`${listboxId}-opt-${room.id}`}
              data-room-option={room.id}
              role="option"
              aria-selected={selected}
              aria-label={roomOptionLabel(room)}
              className={`room-picker-card ${selected ? "selected" : ""}`}
              onClick={() => onSelect(room.id)}
            >
              <span className="room-picker-card-top">
                <span className="room-picker-code">{room.code}</span>
                {selected ? (
                  <span className="room-picker-selected-badge" aria-hidden="true">
                    Terpilih
                  </span>
                ) : null}
              </span>
              <strong className="room-picker-name">{room.name}</strong>
              <span className="room-picker-meta text-muted">
                {formatRoomMeta(room)}
              </span>
              <span className="room-picker-amenities">
                {formatAmenities(room.amenities)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="room-picker-hint text-muted">
        Gunakan panah kiri/kanan untuk pindah kartu. Kode{" "}
        <span className="room-picker-code-inline">MR-A</span> …{" "}
        <span className="room-picker-code-inline">MR-E</span> selaras daftar ruang demo.
      </p>
    </section>
  );
}
