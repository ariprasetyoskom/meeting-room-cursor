# Workspace — Booking Ruang Meeting

Monorepo workspace untuk dokumentasi, aplikasi web, dan DevOps terkait **Aplikasi Booking Ruang Meeting**.

## Struktur

```text
D:\Cursor\
├── Docs\          # BRD, PRD, TDD, Architecture, Design
├── Apps\
│   └── web\       # Next.js 14 — UI + API MVP
└── Devops\
    ├── docker\    # Postgres + Redis lokal
    ├── ci\        # Contoh pipeline (GitHub Actions)
    └── infra\     # Terraform / K8s (placeholder)
```

| Folder | Isi |
|--------|-----|
| [**Docs/**](./Docs/README.md) | BRD, PRD, TDD, Architecture, Design (selaras stack & UI) |
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

- Dokumentasi: BRD/PRD/TDD **v1.1**, Architecture **v1.2**, Design **v1.0** — lihat [Docs/README.md](./Docs/README.md).
- Aplikasi `Apps/web`: **MVP berjalan** — Drizzle, API, OIDC/dev auth, UI `/book` (RoomPicker 5 ruang), `/rooms`, `/bookings`; admin UI & E2E menyusul.
