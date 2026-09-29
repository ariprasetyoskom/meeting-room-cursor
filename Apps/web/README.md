# Web — Booking Ruang Meeting

Next.js 14 (App Router) + Drizzle ORM + PostgreSQL + BullMQ.

Spesifikasi: [TDD v1.1](../../Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Design UI/UX](../../Docs/Design-Aplikasi-Booking-Ruang-Meeting.md)

## Prasyarat

- Node.js 20+
- Docker: [../../Devops/docker/docker-compose.yml](../../Devops/docker/docker-compose.yml)

## Setup lokal

```bash
# 1. Infra
cd ../../Devops/docker
docker compose up -d

# 2. App
cd ../../Apps/web
cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
# Salin DEV_USER_ID dari output seed ke .env.local

npm run dev
```

Terminal kedua (opsional, butuh REDIS_URL):

```bash
npm run worker:email
```

## API (MVP)

| Method | Path |
|--------|------|
| GET | `/api/health` |
| GET | `/api/v1/me` |
| GET | `/api/v1/rooms` |
| GET/POST | `/api/v1/bookings` |
| POST | `/api/v1/bookings/:id/cancel` |

Dev auth: header `x-dev-user-id` atau env `DEV_USER_ID` dengan `AUTH_MODE=dev`.

## Scripts

| Script | Fungsi |
|--------|--------|
| `npm run db:generate` | Generate migration dari `src/db/schema.ts` (Drizzle Kit) |
| `npm run db:migrate` | Jalankan migrator Drizzle ORM + constraint SQL |
| `npm run db:studio` | Drizzle Studio (browse data) |
| `npm run db:seed` | User demo + **5 ruang** (MR-A … MR-E, lihat `src/data/seed-rooms.ts`) |
| `npm run test` | Unit tests (Vitest) |
| `npm run worker:email` | Consumer email bilingual |

## Struktur

```text
src/
  app/           # UI + route handlers
  db/            # schema, migrate, seed
  lib/           # domain, auth dev, queue
  workers/       # BullMQ email worker
drizzle/migrations/
```

## Autentikasi

| Mode | Env | Cara pakai |
|------|-----|------------|
| **dev** (default) | `AUTH_MODE=dev` | Banner Dev user ID atau `DEV_USER_ID` + header |
| **oidc** | `AUTH_MODE=oidc` + `AUTH_SECRET` + `OIDC_*` | Login `/login` → SSO; session cookie ke API |

Redirect URI di IdP: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/oidc`

Setelah ubah `.env.local`, restart `npm run dev`.

## Admin (F-08–F-09, F-11)

Set `DEV_USER_ID` ke **`ADMIN_DEV_USER_ID`** dari output `npm run db:seed` (user `admin@example.com`).

| Route | Fungsi |
|-------|--------|
| `/admin/rooms` | CRUD / aktif-nonaktif ruang |
| `/admin/bookings` | Semua booking + cancel admin (alasan wajib) |
| `/admin/audit` | Audit log booking & ruang |

## Berikutnya

- SMTP pengiriman email nyata
- Playwright E2E (dev + OIDC staging)
