# 000 — Platform & Environment Setup

Dokumen seri **platform setup** untuk proyek Booking Ruang Meeting: persiapan lingkungan dev/staging/prod selaras arsitektur, tech stack, dan desain UI.

## Dokumen di folder ini

| Dokumen | Deskripsi |
|---------|-----------|
| [PRD-Platform-Environment-Setup.md](./PRD-Platform-Environment-Setup.md) | **PRD v1.1** — requirement, env vars, F-PS ↔ PSET, acceptance §9 |
| [PRD_platform_setup_development_phase.md](./PRD_platform_setup_development_phase.md) | **Fase v1.1** — runbook Fase 0–9 + task `PSETxx-{kanonik}-task` (selaras PRD) |
| [arsitektur.md](./arsitektur.md) | Ringkasan arsitektur relevan setup (→ dokumen penuh) |
| [techstack.md](./techstack.md) | Ringkasan tech stack & tooling (→ TDD) |
| [design.md](./design.md) | Ringkasan verifikasi UI lokal (→ Design) |

## Dokumen induk (source of truth)

| Topik | Path |
|-------|------|
| Architecture v1.2 | [../Architecture-Aplikasi-Booking-Ruang-Meeting.md](../Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| TDD / tech stack v1.1 | [../TDD-Aplikasi-Booking-Ruang-Meeting.md](../TDD-Aplikasi-Booking-Ruang-Meeting.md) |
| Design UI/UX v1.0 | [../Design-Aplikasi-Booking-Ruang-Meeting.md](../Design-Aplikasi-Booking-Ruang-Meeting.md) |
| BRD / PRD produk | [../BRD-Aplikasi-Booking-Ruang-Meeting.md](../BRD-Aplikasi-Booking-Ruang-Meeting.md) · [../PRD-Aplikasi-Booking-Ruang-Meeting.md](../PRD-Aplikasi-Booking-Ruang-Meeting.md) |

## Urutan eksekusi (developer baru)

1. PRD §1–5 + **Fase 0** ([development phase](./PRD_platform_setup_development_phase.md)).
2. **Fase 1 → 4** (stack → infra → be → fe) — mirror PRD §7.1.
3. Sign-off **Fase 9** = PRD §9; opsional Fase 5–6 (auth/worker).
4. **Fase 7–8** = PRD §8 staging/prod + Architecture §8.4.
