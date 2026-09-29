# Dokumentasi — Aplikasi Booking Ruang Meeting

Indeks dokumen spesifikasi, desain, dan arsitektur — **selaras dengan implementasi** di `Apps/web`.

## Platform setup (000)

| Dokumen | Deskripsi |
|---------|-----------|
| [000_platform_setup/](./000_platform_setup/README.md) | **PRD setup environment** + ringkasan arsitektur, tech stack, design |

## Dokumen Utama

| Dokumen | Versi | Deskripsi |
|---------|-------|-----------|
| [BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) | **1.1** | Business requirements: KPI, BR/FR/NFR, stack ringkas §10 |
| [PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) | **1.1** | Produk: D-1–D-3, F-01–F-12, UX §6 |
| [TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) | **1.1** | Tech stack terkunci (Drizzle, Next 14), API, DB, env |
| [Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) | **1.2** | C4, ADR-001–006, CI/CD, observability, QA |
| [Design-Aplikasi-Booking-Ruang-Meeting.md](./Design-Aplikasi-Booking-Ruang-Meeting.md) | **1.0** | UI/UX, tokens, layar `/book` + RoomPicker 5 ruang |

## Selaraskan Stack (Referensi Cepat)

| Topik | BRD | TDD | Architecture | Design |
|-------|-----|-----|--------------|--------|
| Next.js 14 + TS | §10 | §2 | §3.4 | §3 |
| Drizzle + Postgres 15 | §10 | §2–4 | §3.4, ADR-006 | — |
| Redis + BullMQ | §10 | §2, §7 | ADR-003 | — |
| Auth.js OIDC + dev | §10 | §6 | §3.3 | §5 |
| UI `/book`, 5 ruang | §8.1 | §8 | §3.3 | §6 |
| Docker PG **5434** | §10 | §2 | §6 | — |

## Urutan Baca Disarankan

0. **000_platform_setup** — onboarding dev & env (jika setup mesin baru).
1. **BRD** — konteks bisnis dan acceptance criteria.
2. **PRD** — scope produk dan keputusan terkunci.
3. **Design** — layar, copy, dan visual untuk PO/UX/engineering.
4. **TDD** — implementasi teknis untuk engineering.
5. **Architecture** — operasi, pipeline, ADR jangka panjang.

## Lokasi Kode & DevOps

- Aplikasi: [../Apps/web/README.md](../Apps/web/README.md)
- Docker lokal: [../Devops/docker/README.md](../Devops/docker/README.md)
- CI contoh: [../Devops/ci/README.md](../Devops/ci/README.md)
