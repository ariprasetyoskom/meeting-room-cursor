---
name: platform-techstack
description: >-
  Menyusun ringkasan tech stack untuk platform setup (Node, Next.js, Drizzle,
  Docker ports, scripts). Gunakan saat user minta Docs/000_platform_setup/techstack.md
  atau dokumentasi toolchain onboarding developer.
---

# Platform Setup — Tech Stack (ringkasan)

## Kapan dipakai

- Dokumen **single page** untuk developer baru (selaras PRD platform F-PS-02).
- Harus match TDD §2 dan `Apps/web/package.json` jika repo ada.

## Referensi emas

- [Docs/000_platform_setup/techstack.md](../../Docs/000_platform_setup/techstack.md)
- [Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md)

## Workflow

1. Baca [template.md.tmpl](./template.md.tmpl).
2. Verifikasi versi dari `package.json`, compose, README — jangan hardcode versi usang.
3. Isi placeholder; tambah catatan OS (Windows `loadAppEnv`) jika proyek Next + `.env.local`.
4. Output default: `Docs/000_platform_setup/techstack.md`.

## Aturan

- Tabel versi + port + scripts wajib.
- Struktur monorepo singkat (`Apps/web`, `Devops`, `Docs`).
- Link ke TDD untuk detail API/DB.

## Template

[template.md.tmpl](./template.md.tmpl)
