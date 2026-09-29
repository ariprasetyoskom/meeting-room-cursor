# Web — Booking Ruang Meeting

Next.js 14 (App Router) + Drizzle ORM + PostgreSQL + BullMQ.

Spesifikasi: [../../Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md)

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
| `npm run db:migrate` | SQL migration + exclusion constraint |
| `npm run db:seed` | User demo + ruang contoh |
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

## Berikutnya

- Auth.js OIDC production
- UI timeline booking (PRD F-02–F-07)
- SMTP pengiriman email nyata
- Playwright E2E di staging
