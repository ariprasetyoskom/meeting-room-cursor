# Workspace — Booking Ruang Meeting

Monorepo workspace untuk dokumentasi, aplikasi web, dan DevOps terkait **Aplikasi Booking Ruang Meeting**.

## Struktur

```text
D:\Cursor\
├── Docs\          # BRD, PRD, TDD, Architecture, Design
├── Agentic\       # Skill + template generator dokumen (→ .cursor/skills)
├── Apps\
│   └── web\       # Next.js 14 — UI + API MVP
└── Devops\
    ├── docker\    # Postgres + Redis lokal
    ├── ci\        # GitHub Actions (lihat .github/workflows/)
    └── infra\     # Terraform / K8s (placeholder)
```

| Folder | Isi |
|--------|-----|
| [**Docs/**](./Docs/README.md) | BRD, PRD, TDD, Architecture, Design (selaras stack & UI) |
| [**Agentic/**](./Agentic/README.md) | Skill agent untuk BRD & ringkasan platform setup |
| [**Apps/**](./Apps/README.md) | Kode aplikasi (Next.js monorepo — `web/`) |
| [**Devops/**](./Devops/README.md) | Docker lokal, CI contoh, placeholder infra |

## Mulai Cepat

1. Baca [Docs/README.md](./Docs/README.md) untuk indeks dokumen.
2. Jalankan Postgres & Redis lokal: [Devops/docker/README.md](./Devops/docker/README.md).
3. Implementasi aplikasi mengikuti [Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md](./Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md).

## Keputusan Produk Kunci

- Cancel hanya oleh organizer dengan window waktu (PRD **D-1**).
- Nama organizer tampil di kalender (**D-2**).
- Email notifikasi bilingual ID/EN (**D-3**).

## Status

- Dokumentasi: BRD/PRD **v1.2**, Architecture **v1.3**, TDD **v1.1**, Design **v1.1** — [Docs/README.md](./Docs/README.md).
- Repo GitHub: [meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor) · CI GitHub Actions.
- Aplikasi `Apps/web`: MVP core + admin (F-08–F-11); backlog: email SMTP penuh, week view, E2E.
