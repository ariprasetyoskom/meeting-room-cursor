"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch, type Room } from "@/lib/client-api";
import {
  formatAmenities,
  formatRoomMeta,
  normalizeRoomCodeParam,
  roomDetailHref,
} from "@/lib/room-display";
import { Alert } from "./ui/Alert";
import { buttonClass } from "./ui/Button";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/EmptyState";
import { ListLoadError } from "./ui/ListLoadError";
import { LoadingBlock } from "./ui/LoadingBlock";
import { PageHeader } from "./ui/PageHeader";

type Props = {
  codeParam: string;
};

export function RoomDetail({ codeParam }: Props) {
  const code = normalizeRoomCodeParam(codeParam);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setUnauthorized(false);
    setRoom(null);
    try {
      const res = await apiFetch<{ room: Room }>(
        `/api/v1/rooms/${encodeURIComponent(code)}`,
      );
      setRoom(res.room);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUnauthorized(true);
        setError("Silakan login di /login.");
      } else if (e instanceof ApiError && e.status === 404) {
        setNotFound(true);
      } else {
        setError(e instanceof Error ? e.message : "Gagal memuat.");
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page-content">
      <PageHeader
        title={room ? room.name : `Ruang ${code}`}
        description={
          room
            ? `Kode ${room.code} · ${formatRoomMeta(room)}`
            : "Detail ruang meeting (F-03)."
        }
        actions={
          <Link href="/rooms" className={buttonClass({ variant: "secondary" })}>
            Daftar ruang
          </Link>
        }
      />

      {unauthorized && error && <Alert variant="error">{error}</Alert>}

      {!unauthorized && error && !loading && (
        <ListLoadError message={error} onRetry={load} bookLabel="Ke kalender booking" />
      )}

      {loading && <LoadingBlock />}

      {!loading && notFound && (
        <EmptyState bookLabel="Ke kalender booking">
          <p>
            Ruang dengan kode <strong>{code}</strong> tidak ditemukan atau tidak
            aktif.
          </p>
          <p className="text-muted">
            <Link href="/rooms">Kembali ke daftar ruang</Link>
          </p>
        </EmptyState>
      )}

      {!loading && room && (
        <Card as="section" padding="lg" className="room-detail-card">
          <dl className="room-detail-grid">
            <div className="room-detail-row">
              <dt>Kode</dt>
              <dd>{room.code}</dd>
            </div>
            <div className="room-detail-row">
              <dt>Kapasitas</dt>
              <dd>{room.capacity} orang</dd>
            </div>
            <div className="room-detail-row">
              <dt>Lantai</dt>
              <dd>{room.floor ?? "—"}</dd>
            </div>
            <div className="room-detail-row room-detail-row-full">
              <dt>Fasilitas</dt>
              <dd>{formatAmenities(room.amenities)}</dd>
            </div>
          </dl>
          <p className="text-muted room-detail-note">
            Foto ruang (OQ-3) belum tersedia — informasi teks sesuai MVP.
          </p>
          <div className="room-detail-actions">
            <Link
              href={`/book?room=${room.id}`}
              className={buttonClass({ variant: "primary" })}
            >
              Pesan ruang
            </Link>
            <Link
              href={`/book?room=${room.id}`}
              className={buttonClass({ variant: "secondary" })}
            >
              Lihat kalender
            </Link>
          </div>
        </Card>
      )}

      {room && (
        <p className="text-muted room-detail-permalink">
          Tautan:{" "}
          <Link href={roomDetailHref(room.code)}>{roomDetailHref(room.code)}</Link>
        </p>
      )}
    </div>
  );
}
