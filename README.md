# Workspace — Booking Ruang Meeting

Monorepo workspace untuk dokumentasi, aplikasi web, dan DevOps terkait **Aplikasi Booking Ruang Meeting**.

## Struktur

```text
D:\Cursor\
├── Docs\          # BRD, PRD, TDD, Architecture
├── Apps\
│   └── web\       # Aplikasi Next.js (planned)
└── Devops\
    ├── docker\    # Postgres + Redis lokal
    ├── ci\        # Contoh pipeline (GitHub Actions)
    └── infra\     # Terraform / K8s (placeholder)
```

| Folder | Isi |
|--------|-----|
| [**Docs/**](./Docs/README.md) | BRD, PRD, TDD, Architecture (spesifikasi lengkap) |
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

- Dokumentasi: baseline v1.0 / Architecture v1.1.
- Aplikasi `Apps/web`: **scaffold MVP** — API + DB + worker; UI timeline menyusul.
