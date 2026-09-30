---
name: platform-arsitektur
description: >-
  Menyusun ringkasan arsitektur konteks platform setup (container, environment,
  ADR, health). Gunakan saat user minta Docs/000_platform_setup/arsitektur.md,
  arsitektur setup environment, atau ringkasan Architecture untuk onboarding dev.
---

# Platform Setup — Arsitektur (ringkasan)

## Kapan dipakai

- Dokumen **ringkas** untuk folder `Docs/000_platform_setup/`, bukan pengganti Architecture penuh.
- Onboarding: jelaskan container lokal, staging/prod logical, ADR yang mempengaruhi env.

## Referensi emas

- Ringkasan: [Docs/000_platform_setup/arsitektur.md](../../Docs/000_platform_setup/arsitektur.md)
- Detail: [Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md)

## Workflow

1. Baca [template.md.tmpl](./template.md.tmpl).
2. Ambil versi stack & port dari `techstack.md` / `Devops/docker/docker-compose.yml` — jangan contradict.
3. Isi placeholder; link ke Architecture § yang relevan.
4. Output default: `Docs/000_platform_setup/arsitektur.md`.

## Aturan

- Maks ~60 baris efektif; tabel > prosa panjang.
- Port lokal PG **5434**, Redis **6379** kecuali proyek lain didefinisikan user.
- Sebut `GET /api/health` sebagai gate setup lokal.

## Template

[template.md.tmpl](./template.md.tmpl)
