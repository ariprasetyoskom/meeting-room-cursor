---
name: brd-booking-meeting
description: >-
  Menyusun atau memperbarui Business Requirements Document (BRD) aplikasi
  booking ruang meeting. Gunakan saat user minta BRD, business requirements,
  KPI, aturan bisnis BR-xx, FR/NFR, acceptance criteria MVP, atau dokumen selaras
  Docs/BRD-Aplikasi-Booking-Ruang-Meeting.md.
---

# BRD — Booking Ruang Meeting

## Kapan dipakai

- Buat BRD baru untuk proyek serupa (internal room booking).
- Perbarui BRD existing setelah perubahan scope, KPI, atau acceptance.
- Turunkan keputusan bisnis ke PRD/TDD tanpa menulis detail teknis implementasi.

## Referensi emas

Baca sebelum menulis: [Docs/BRD-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/BRD-Aplikasi-Booking-Ruang-Meeting.md).

## Workflow

1. Baca [template.md.tmpl](./template.md.tmpl).
2. Kumpulkan dari user (atau infer dari repo): nama produk, versi, tanggal, status, MVP vs Fase 2, stakeholder, KPI target.
3. Isi placeholder `{{...}}`; hapus baris opsional jika tidak relevan.
4. Tulis output ke path yang diminta user, default: `Docs/BRD-{{PRODUCT_SLUG}}.md`.
5. Cross-check: setiap **Must** BR punya trace ke FR; acceptance §13 selaras PRD F-xx bila ada.

## Aturan penulisan

- Bahasa: **Indonesia** (istilah teknis EN boleh: SSO, MVP, API).
- ID aturan: **BR-xx**, FR: **FR-xx**, konsisten increment.
- MVP vs Fase 2: jangan campur scope Fase 2 ke §3.1.
- §10 stack: ringkas saja; detail ke TDD/Architecture (link, jangan duplikasi panjang).
- Acceptance criteria: gunakan `[ ]` / `[x]` + **Bukti** jika dokumen status implementasi.

## Validasi sebelum selesai

- [ ] Metadata lengkap (versi, tanggal, dokumen terkait).
- [ ] KPI punya pemilik dan target terukur.
- [ ] BR-01 overlap & BR-03 cancel policy eksplisit.
- [ ] User journey minimal: booking sukses, cancel, bentrok, admin ruang.
- [ ] §13 acceptance dapat diuji (QA/UAT).
- [ ] Glosarium istilah kunci.

## Template

Struktur wajib: [template.md.tmpl](./template.md.tmpl).
