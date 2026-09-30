# Wiki — Booking Ruang Meeting

Wiki tim untuk aplikasi **internal booking ruang meeting** ([meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor)).

> **Source of truth teknis** tetap di repo: folder [`Docs/`](https://github.com/ariprasetyoskom/meeting-room-cursor/tree/cursor/meeting-room-web-scaffold/Docs). Wiki ini = onboarding cepat PO, dev, dan QA.

## Mulai di sini

| Halaman | Untuk siapa |
|---------|-------------|
| [Getting Started](Getting-Started) | Developer — setup Docker + `npm run dev` |
| [Product & Roadmap](Product-and-Roadmap) | PO / PM — fitur F-01–F-12, gelombang W0–W4 |
| [Troubleshooting](Troubleshooting) | Dev — timeout, Redis, DB, booking gagal |
| [Documentation Index](Documentation-Index) | Link ke BRD, PRD, TDD, Architecture di repo |

## Repo & CI

- **Branch aktif:** `cursor/meeting-room-web-scaffold`
- **CI:** [GitHub Actions](https://github.com/ariprasetyoskom/meeting-room-cursor/actions/workflows/ci.yml)
- **Issues:** [Wave 1 Email (F-10)](https://github.com/ariprasetyoskom/meeting-room-cursor/issues?q=label%3Awave1) · [UI enhance #30](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/30)

## Stack singkat

Next.js 14 · Drizzle · PostgreSQL **5434** · Redis **6379** · Auth.js (dev + OIDC) · BullMQ email
