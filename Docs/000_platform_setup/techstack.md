# Tech Stack — Konteks Setup Environment

Ringkasan untuk **platform setup**. Source of truth: [TDD v1.1 §2](../TDD-Aplikasi-Booking-Ruang-Meeting.md).

## Runtime & aplikasi

| Komponen | Versi / alat |
|----------|----------------|
| Node.js | **20 LTS** |
| Package manager | npm (lockfile di `Apps/web`) |
| Framework | Next.js **14.2.x** App Router |
| UI | React **18**, TypeScript **5** strict |
| ORM | **Drizzle ORM** + drizzle-kit |
| DB driver | `postgres` (postgres.js) |
| Validasi | Zod |
| Test | Vitest (`npm run test`) |
| Auth | Auth.js (`next-auth` v5 beta) |

## Data & async

| Layanan | Image / port lokal |
|---------|-------------------|
| PostgreSQL 15 | `postgres:15-alpine`, **127.0.0.1:5434** |
| Redis 7 | `redis:7-alpine`, **6379** |
| BullMQ | Worker: `npm run worker:email` |

## Scripts wajib (Apps/web)

| Script | Fungsi |
|--------|--------|
| `npm run db:migrate` | Migrasi + exclusion constraint |
| `npm run db:seed` | User demo + 5 ruang (MR-A … MR-E) |
| `npm run dev` | Dev server **:3000** |
| `npm run build` / `start` | Production-like lokal |
| `npm run lint` | ESLint |
| `npm run worker:email` | Consumer email |

## Struktur repo (setup)

```text
Apps/web/          # aplikasi
Devops/docker/     # compose Postgres + Redis
Docs/              # spesifikasi
```

## Catatan Windows

- Variabel `DATABASE_URL` di **environment OS** dapat menimpa `.env.local` pada proses Node; aplikasi memuat `.env.local` di development via `loadAppEnv()` ([TDD](../TDD-Aplikasi-Booking-Ruang-Meeting.md), `src/db/index.ts`).
- Disarankan: gunakan port **5434** di `.env.local`, hindari konflik Postgres lokal di 5432/5433.
