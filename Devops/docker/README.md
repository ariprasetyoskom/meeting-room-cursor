# Docker — Local Development

Stack lokal untuk **Booking Ruang Meeting**: PostgreSQL 15 dan Redis 7, selaras [TDD](../../Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md).

## Prasyarat

- Docker Desktop atau Docker Engine + Compose v2

## Menjalankan

Dari folder ini:

```bash
docker compose up -d
```

## Koneksi Default

| Service | URL / Host | Credentials |
|---------|------------|-------------|
| PostgreSQL | `127.0.0.1:5434` (host) | user `booking`, password `booking_dev`, db `booking_meeting` |
| Redis | `localhost:6379` | no password (dev only) |

**DATABASE_URL** contoh:

```text
postgresql://booking:booking_dev@127.0.0.1:5434/booking_meeting
```

**REDIS_URL** contoh:

```text
redis://localhost:6379
```

## Health

```bash
docker compose ps
```

Kedua service memiliki healthcheck; tunggu status `healthy` sebelum migrasi.

## PostgreSQL Notes

Extension `btree_gist` diperlukan untuk exclusion constraint booking — aktifkan saat migrasi pertama (lihat TDD §4.2):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

## Stop & Reset

```bash
docker compose down
docker compose down -v   # hapus volume (reset data)
```

## Keamanan

Kredensial di atas **hanya untuk development lokal**. Jangan digunakan di staging/production.
