# Apps

Folder aplikasi untuk **Booking Ruang Meeting**.

## Struktur

```text
Apps/
  web/          # Next.js 14 — UI + /api/v1 (MVP)
```

Dokumen: [TDD](../Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Design](../Docs/Design-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture](../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## Prasyarat Dev

- Node.js 20 LTS
- Docker (Postgres 15 + Redis 7): [../Devops/docker/docker-compose.yml](../Devops/docker/docker-compose.yml)

## Paket / Repo Strategy

MVP menggunakan **single app** di `web/` (monolith Next.js). Worker email BullMQ dapat berjalan sebagai process terpisah dari image yang sama — lihat Architecture ADR-001 dan ADR-003.

## Langkah Implementasi (Checklist)

- [x] Scaffold Next.js + TypeScript di `web/`
- [x] Migrasi DB + exclusion constraint (TDD §4)
- [x] API bookings & rooms (dev auth)
- [x] Worker email bilingual (log / SMTP placeholder)
- [x] Auth.js OIDC (`AUTH_MODE=oidc`)
- [x] UI kalender + booking flows (PRD F-02–F-07 MVP)

Detail per-app: [web/README.md](./web/README.md).
