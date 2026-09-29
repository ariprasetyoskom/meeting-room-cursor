# Technical Design Document (TDD)
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | TDD-Aplikasi-Booking-Ruang-Meeting |
| **Versi** | **1.1** |
| **Tanggal** | 29 September 2026 |
| **Status** | Selaras implementasi `Apps/web` |
| **Dokumen Terkait** | [BRD](./BRD-Aplikasi-Booking-Ruang-Meeting.md) · [PRD](./PRD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) · [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md) |

---

## 1. Tujuan

Mendeskripsikan implementasi teknis MVP: stack Next.js + PostgreSQL (exclusion constraint), API REST, autentikasi, email bilingual async via BullMQ/Redis, dan struktur monorepo di `Apps/web`.

---

## 2. Stack (Baseline Terkunci)

Stack ini **sama** di BRD §10, Architecture §3, dan [Design §3](./Design-Aplikasi-Booking-Ruang-Meeting.md).

| Layer | Pilihan | Versi / Catatan |
|-------|---------|-----------------|
| Runtime | Node.js | **20 LTS** |
| Framework | Next.js (App Router) | **14.2.x** |
| UI | React | **18** |
| Language | TypeScript | **5**, `strict` |
| ORM | **Drizzle ORM** | `drizzle-orm` + **drizzle-kit** migrasi; driver `postgres` (postgres.js) |
| Database | PostgreSQL | **15** (Alpine di Docker) |
| Cache / Queue | Redis | **7** |
| Job queue | BullMQ | Worker terpisah `npm run worker:email` |
| Validasi API | Zod | Request/response write endpoints |
| Unit test | Vitest | Policy & validators |
| Email | SMTP / SendGrid API | HTML bilingual (D-3); dev: log worker |
| Auth | **Auth.js** (`next-auth` v5 beta) | **OIDC** prod + **`AUTH_MODE=dev`** lokal |
| Styling | CSS variables | `globals.css` — lihat Design tokens |

**Local dev:** Postgres host **`127.0.0.1:5434`** → container `5432` ([docker-compose](../Devops/docker/docker-compose.yml)); Redis `6379`.

---

## 3. Struktur Repositori (Aktual)

```text
Apps/web/
  src/app/              # /book, /rooms, /bookings, /login, /api/*
  src/components/       # AppShell, BookingCalendar, RoomPicker, BookingModal, …
  src/data/seed-rooms.ts # 5 ruang demo (MR-A … MR-E)
  src/db/
    schema.ts           # Drizzle schema
    repositories/       # rooms, bookings
    migrate.ts, seed.ts
  src/lib/              # booking-service, auth, queue, validators
  src/workers/          # email-worker.ts
  drizzle/migrations/   # SQL migrasi Drizzle Kit
  drizzle/custom/       # booking_constraints.sql (exclusion)
Devops/docker/          # Postgres 5434, Redis 6379
Docs/                   # BRD, PRD, TDD, Architecture, Design
```

Detail workspace: [../Apps/web/README.md](../Apps/web/README.md).

---

## 4. Model Data & PostgreSQL Exclusion Constraint

### 4.1 Enum & Tables

```sql
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  floor       TEXT,
  capacity    INT NOT NULL CHECK (capacity > 0),
  amenities   JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id            UUID NOT NULL REFERENCES rooms(id),
  organizer_user_id  UUID NOT NULL REFERENCES users(id),
  title              TEXT NOT NULL,
  description        TEXT,
  start_at           TIMESTAMPTZ NOT NULL,
  end_at             TIMESTAMPTZ NOT NULL,
  status             booking_status NOT NULL DEFAULT 'confirmed',
  cancelled_at       TIMESTAMPTZ,
  cancelled_by       UUID REFERENCES users(id),
  cancel_reason      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  action        TEXT NOT NULL,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.2 Anti-Overlap dengan `btree_gist` + Exclusion Constraint

Prinsip: untuk status `confirmed`, range `[start_at, end_at)` tidak boleh overlap per `room_id`.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap_confirmed
EXCLUDE USING gist (
  room_id WITH =,
  tstzrange(start_at, end_at, '[)') WITH &&
)
WHERE (status = 'confirmed');
```

**Perilaku aplikasi:**

- Insert/update ke `confirmed` yang bentrok → PostgreSQL error `23P01` (exclusion_violation).
- API map ke HTTP **409 Conflict** dengan body `{ code: 'ROOM_CONFLICT', message: '...' }`.
- Cancel: set `status = 'cancelled'` sehingga baris keluar dari predicate `WHERE (status = 'confirmed')` dan slot bebas.

### 4.3 Indexes

```sql
CREATE INDEX idx_bookings_room_start ON bookings (room_id, start_at) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_organizer ON bookings (organizer_user_id, start_at DESC);
```

---

## 5. API Design (REST)

Base path: `/api/v1`. Semua endpoint (kecuali health/auth callback) memerlukan session valid.

### 5.1 Auth

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/auth/*` | Auth.js handlers |
| GET | `/api/v1/me` | Profil user + role |

### 5.2 Rooms

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/v1/rooms` | employee+ | List active rooms; query `floor`, `minCapacity` |
| GET | `/api/v1/rooms/:id` | employee+ | Detail |
| POST | `/api/v1/rooms` | admin | Create |
| PATCH | `/api/v1/rooms/:id` | admin | Update / deactivate |

### 5.3 Bookings

| Method | Path | Auth | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/v1/bookings` | employee+ | Query: `roomId`, `from`, `to`, `mine=true` |
| GET | `/api/v1/bookings/:id` | employee+ | Detail incl. organizer display_name (D-2) |
| POST | `/api/v1/bookings` | employee+ | Create; enqueue email |
| POST | `/api/v1/bookings/:id/cancel` | organizer or admin | Body: `{ reason? }`; D-1 rules |

**Create booking body:**

```json
{
  "roomId": "uuid",
  "title": "Sprint Planning",
  "description": "optional",
  "startAt": "2026-10-01T09:00:00+07:00",
  "endAt": "2026-10-01T10:00:00+07:00"
}
```

**Validasi server (selain DB):**

- `startAt` ≥ now + 15 minutes (BR-02).
- Duration 30 min – 8 hours (BR-04).
- Room `is_active = true`.
- Cancel: session user must be organizer OR admin; if organizer, `startAt - now >= 1 hour` (BR-03).

### 5.4 Admin

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/v1/admin/audit-logs` | Paginated audit |
| GET | `/api/v1/admin/bookings/export` | CSV (F-12 Could) |

### 5.5 Health

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/health` | `{ status, db, redis }` |

OpenAPI spec: generate from Zod schemas (`zod-to-openapi`) in repo `Apps/web`.

---

## 6. Autentikasi & Otorisasi

### 6.1 Auth.js Configuration

- Provider: OIDC (Azure AD / Keycloak / generic).
- Session strategy: JWT atau database session — prefer **database session** jika revoke diperlukan.
- Callback sync user ke tabel `users` on first login (`email`, `display_name` from IdP claims).

### 6.2 RBAC

| Role | Permissions |
|------|-------------|
| `employee` | Read rooms/calendar; CRUD own bookings; cancel own (restricted) |
| `admin` | All employee + room admin + cancel any with reason + audit read |

Middleware Next.js: `middleware.ts` protects `/book`, `/bookings`, `/rooms`, `/login`, and `/api/v1/*`.

### 6.3 Security

- CSRF on cookie session mutations.
- Rate limit booking POST: 30/hour/user (Redis sliding window).
- Input validation Zod on all write endpoints.

---

## 7. Email Bilingual (D-3)

### 7.1 Template Structure

Satu HTML email, dua section:

1. **Bahasa Indonesia** — judul, ruang, waktu (format `id-ID`), organizer.
2. **English** — parallel content.

Subject example: `[Booking] Ruang A — 1 Okt 09:00 / Room A — Oct 1 09:00`

### 7.2 Event Types

| Job name | Trigger |
|----------|---------|
| `email.booking.confirm` | POST booking success |
| `email.booking.cancel` | Cancel success |
| `email.booking.reminder` | Scheduled job scans bookings starting in 60 min |

### 7.3 BullMQ

**Producer** (Next.js API route after commit):

```typescript
await emailQueue.add('email.booking.confirm', {
  bookingId,
  to: organizerEmail,
}, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });
```

**Consumer** (`Apps/web/src/workers/email-worker.ts`):

- Load booking + room + organizer from DB.
- Render template `emails/booking-confirm.tsx` (React Email optional).
- Send via SMTP; log message id to `audit_logs` or `email_deliveries` table (optional MVP).

**Redis connection:** `REDIS_URL` from env; same instance as rate limit.

---

## 8. Frontend (Next.js)

Spesifikasi layar, tokens, dan komponen: [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md).

### 8.1 Routes

| Route | Status | Purpose |
|-------|--------|---------|
| `/book` | ✅ | F-04 timeline/list + F-05 modal booking + **RoomPicker** (5 ruang) |
| `/rooms` | ✅ | F-02 daftar ruang |
| `/bookings` | ✅ | F-06 + F-07 cancel |
| `/login` | ✅ | OIDC entry |
| `/admin/rooms` | ✅ | F-08 CRUD ruang |
| `/admin/bookings` | ✅ | F-09 semua booking + cancel admin |
| `/admin/audit` | ✅ | F-11 audit log |

Middleware melindungi `/book`, `/bookings`, `/rooms`, `/api/v1/*`, `/login`.

### 8.2 Data Fetching

- Halaman kalender: client fetch ke `/api/v1/rooms` dan `/api/v1/bookings`.
- Mutations via `fetch` ke API; **tanpa optimistic UI** pada create (tunggu 201/409).

### 8.3 Seed data ruang

`npm run db:seed` upsert **5 ruang** dari `SEED_ROOMS` (kode unik MR-A … MR-E).

### 8.4 Timezone

- Simpan UTC/`timestamptz` di DB; tampilkan **Asia/Jakarta** (`Intl`, helper `formatDateId`).

---

## 9. Transaksi & Konsistensi

Create booking flow:

1. Begin transaction (optional if single INSERT).
2. INSERT booking `confirmed`.
3. On success, COMMIT then enqueue email (outbox pattern optional Fase 2).
4. On `23P01`, ROLLBACK → 409.

Cancel flow:

1. SELECT booking FOR UPDATE.
2. Validate D-1 rules.
3. UPDATE status, cancelled_* fields.
4. COMMIT → enqueue cancel email.

---

## 10. Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for BullMQ |
| `AUTH_SECRET` | Auth.js secret |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | IdP |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Mail |
| `BOOKING_MIN_LEAD_MINUTES` | Default 15 |
| `BOOKING_CANCEL_WINDOW_HOURS` | Default 1 |
| `AUTH_MODE` | `dev` \| `oidc` |
| `DEV_USER_ID` | UUID user seed (mode dev) |

---

## 11. Testing Strategy

| Level | Scope |
|-------|-------|
| Unit | Validators, cancel policy, template render |
| Integration | API + real Postgres (testcontainer) — overlap constraint |
| E2E | Playwright: book → conflict → cancel |

Critical test: two parallel POST same room/time → exactly one 201, one 409.

---

## 12. Deployment Notes

- Web: Node container running `next start`.
- Worker: separate container same image, command `node dist/workers/email-worker.js`.
- Migrations: `npm run db:migrate` (Drizzle migrator + custom exclusion SQL).

CI reference: [../Devops/ci/github/ci.yml.example](../Devops/ci/github/ci.yml.example).

---

## 13. Dokumen Terkait

| Dokumen | Path |
|---------|------|
| BRD | [./BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) |
| PRD | [./PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) |
| Architecture v1.2 | [./Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| Design (UI/UX) | [./Design-Aplikasi-Booking-Ruang-Meeting.md](./Design-Aplikasi-Booking-Ruang-Meeting.md) |

---

*Akhir dokumen TDD v1.1.*
