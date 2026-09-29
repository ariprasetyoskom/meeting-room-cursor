# Arsitektur — Konteks Setup Environment

Ringkasan untuk **platform setup**. Detail lengkap: [Architecture v1.2](../Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## Container (MVP)

| Container / proses | Teknologi | Setup lokal |
|--------------------|-----------|-------------|
| Web app | Next.js 14 (UI + `/api/v1`) | `Apps/web` — `npm run dev` / `next start` |
| Email worker | Node + BullMQ | `npm run worker:email` (opsional dev) |
| PostgreSQL 15 | DB utama + exclusion constraint | Docker **host 5434** |
| Redis 7 | Queue + rate limit | Docker **6379** |
| IdP (prod) | OIDC | `AUTH_MODE=oidc` + `OIDC_*` |

## Environment logical (Architecture §6)

| Environment | Data | Catatan setup |
|-------------|------|----------------|
| **local** | Docker PG + Redis | `.env.local`, dev auth |
| **staging** | Subset / anonymized | Secrets via CI environment |
| **production** | HA managed PG/Redis | Manual/tag deploy, migrasi pre-deploy |

## ADR relevan setup

| ADR | Implikasi environment |
|-----|------------------------|
| ADR-001 Monolith Next.js | Satu repo `Apps/web`, satu image deploy |
| ADR-003 BullMQ + Redis | `REDIS_URL` wajib jika worker/email/rate limit |
| ADR-006 Drizzle | `npm run db:migrate` + SQL custom exclusion |
| ADR-005 Email bilingual | SMTP env di staging/prod |

## Health & observability

- Endpoint: `GET /api/health` → `{ status, db, redis }` (Architecture §8.3).
- Lokal: `status: ok` dan `db: true` sebelum UAT UI.

## Keamanan

- TLS di ingress (non-local).
- Secrets tidak di git; `.env.local` gitignored.
- DB user app tanpa SUPERUSER.
