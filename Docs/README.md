# Dokumentasi — Aplikasi Booking Ruang Meeting

Indeks dokumen spesifikasi, desain, dan arsitektur — **selaras dengan implementasi** di `Apps/web`.

## Platform setup (000)

| Dokumen | Deskripsi |
|---------|-----------|
| [000_platform_setup/](./000_platform_setup/README.md) | **PRD setup environment** + ringkasan arsitektur, tech stack, design |

## GitHub Wiki (onboarding tim)

Sumber halaman: [Devops/github-wiki/](../Devops/github-wiki/README.md) — publish ke https://github.com/ariprasetyoskom/meeting-room-cursor/wiki

## Perencanaan & release

| Dokumen | Deskripsi |
|---------|-----------|
| [PLAN-MVP-Delivery.md](./PLAN-MVP-Delivery.md) | **v1.0** — gelombang W0–W4, sprint S4–S7, backlog PLN-001+, gate v1.0.0 |
| [PLAN-Wave-1-Email.md](./PLAN-Wave-1-Email.md) | **v1.0** — pecahan Wave 1: 24 ticket W1-R/M/T/Q/S/O/V, jadwal S4, CSV |
| [PLAN-UI-Enhance.md](./PLAN-UI-Enhance.md) | Epic UI **#30** — token → `/book`; ticket UI-01–10, CSV |
| [RELEASE-NOTES.md](./RELEASE-NOTES.md) | **0.1.0-mvp** — ringkasan fitur, CI, known issues, changelog commit |

## Dokumen Utama

| Dokumen | Versi | Deskripsi |
|---------|-------|-----------|
| [BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) | **1.2** | Business requirements: KPI, BR/FR/NFR, acceptance §13 + GitHub |
| [PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) | **1.4** | Produk: F-01–F-12, status §4.1, gelombang §4.2–§4.3, UX §6 |
| [TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) | **1.1** | Tech stack terkunci (Drizzle, Next 14), API, DB, env |
| [Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) | **1.3** | C4, komponen/rute §3.3, ADR, GitHub Actions CI/CD, QA |
| [Design-Aplikasi-Booking-Ruang-Meeting.md](./Design-Aplikasi-Booking-Ruang-Meeting.md) | **1.1** | UI/UX, app shell + logo, tokens, `/book` + admin |

## Selaraskan Stack (Referensi Cepat)

| Topik | BRD | TDD | Architecture | Design |
|-------|-----|-----|--------------|--------|
| Next.js 14 + TS | §10 | §2 | §3.4 | §3 |
| Drizzle + Postgres 15 | §10 | §2–4 | §3.4, ADR-006 | — |
| Redis + BullMQ | §10 | §2, §7 | ADR-003 | — |
| Auth.js OIDC + dev | §10 | §6 | §3.3 | §5 |
| UI shell, `/book`, 5 ruang, admin | §8.1 | §8 | §3.3 | §5–§7 |
| Docker PG **5434** | §10 | §2 | §6 | — |

## Urutan Baca Disarankan

0. **000_platform_setup** — onboarding dev & env (jika setup mesin baru).
1. **BRD** — konteks bisnis dan acceptance criteria.
2. **PRD** — scope produk dan keputusan terkunci.
3. **PLAN-MVP-Delivery** — sprint, dependency, gate rilis v1.0.0.
4. **Design** — layar, copy, dan visual untuk PO/UX/engineering.
5. **TDD** — implementasi teknis untuk engineering.
6. **Architecture** — operasi, pipeline, ADR jangka panjang.

## Agentic — generator dokumen

Skill + template (`{{placeholder}}`) untuk menyusun ulang dokumen selaras proyek:

| Skill | Output |
|-------|--------|
| [../Agentic/README.md](../Agentic/README.md) | Indeks |
| `brd-booking-meeting` | BRD produk |
| `platform-arsitektur` | `000_platform_setup/arsitektur.md` |
| `platform-design` | `000_platform_setup/design.md` |
| `platform-techstack` | `000_platform_setup/techstack.md` |

Salinan Cursor: [../.cursor/skills/](../.cursor/skills/).

## Lokasi Kode & DevOps

- Aplikasi: [../Apps/web/README.md](../Apps/web/README.md)
- Docker lokal: [../Devops/docker/README.md](../Devops/docker/README.md)
- GitHub Actions CI: [../.github/workflows/ci.yml](../.github/workflows/ci.yml) · [../Devops/ci/README.md](../Devops/ci/README.md)
