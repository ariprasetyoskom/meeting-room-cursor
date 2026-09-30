---
name: platform-design
description: >-
  Menyusun ringkasan design smoke-test untuk platform setup (route checklist,
  auth mode, tokens). Gunakan saat user minta Docs/000_platform_setup/design.md,
  checklist UI post-setup, atau verifikasi visual environment lokal.
---

# Platform Setup — Design (ringkasan)

## Kapan dipakai

- Checklist **smoke test UI** setelah Fase 1–4 platform setup (PRD §9).
- Bukan pengganti [Design-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/Design-Aplikasi-Booking-Ruang-Meeting.md) penuh.

## Referensi emas

- [Docs/000_platform_setup/design.md](../../Docs/000_platform_setup/design.md)
- [Docs/Design-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/Design-Aplikasi-Booking-Ruang-Meeting.md)

## Workflow

1. Baca [template.md.tmpl](./template.md.tmpl).
2. Konfirmasi jumlah ruang seed, route nav, jam operasi kalender.
3. Isi placeholder; selaraskan dengan implementasi `Apps/web` bila repo ada.
4. Output default: `Docs/000_platform_setup/design.md`.

## Aturan

- Fokus **verifikasi** (route + expected behavior), bukan spec visual lengkap.
- Arahkan debug UI gagal load ke health + `DATABASE_URL` (P-02).
- Sebut auth dev vs OIDC secara terpisah.

## Template

[template.md.tmpl](./template.md.tmpl)
