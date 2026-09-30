# Dokumentasi — Aplikasi Booking Ruang Meeting

Indeks dokumen spesifikasi, desain, dan arsitektur — **selaras dengan implementasi** di `Apps/web`.

## Platform setup (000)

| Dokumen | Deskripsi |
|---------|-----------|
| [000_platform_setup/](./000_platform_setup/README.md) | **PRD setup environment** + ringkasan arsitektur, tech stack, design |

## Dokumen Utama

| Dokumen | Versi | Deskripsi |
|---------|-------|-----------|
| [BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) | **1.2** | Business requirements: KPI, BR/FR/NFR, acceptance §13 + GitHub |
| [PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) | **1.2** | Produk: D-1–D-3, F-01–F-12, status impl. §4.1, UX §6 |
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
3. **Design** — layar, copy, dan visual untuk PO/UX/engineering.
4. **TDD** — implementasi teknis untuk engineering.
5. **Architecture** — operasi, pipeline, ADR jangka panjang.

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
