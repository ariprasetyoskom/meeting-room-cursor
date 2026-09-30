# Product & Roadmap

Ringkasan selaras **PRD v1.4** — detail: [PRD di repo](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/PRD-Aplikasi-Booking-Ruang-Meeting.md).

## Keputusan produk (locked)

| ID | Ringkas |
|----|---------|
| **D-1** | Cancel hanya organizer; ≥ 1 jam sebelum start; admin butuh alasan |
| **D-2** | Nama organizer tampil di kalender |
| **D-3** | Email bilingual ID + EN dalam satu message |

## Status fitur (snapshot)

| ID | Fitur | Status | Gelombang berikut |
|----|-------|--------|-------------------|
| F-01 | Login / SSO | Sebagian | **W2** — OIDC staging UAT |
| F-02 | Daftar ruang | Selesai | — |
| F-03 | Detail ruang | Sebagian | **W3** — `/rooms/[code]` |
| F-04 | Kalender Hari/Minggu | Selesai | — |
| F-05 | Buat booking | Selesai | — |
| F-06 | Booking saya | Selesai | — |
| F-07 | Cancel | Selesai | Email cancel → **W1** |
| F-08–F-09 | Admin | Selesai | — |
| F-10 | Email | Sebagian | **W1 Must** — SMTP, reminder |
| F-11 | Audit | Selesai | — |
| F-12 | Export CSV | Belum | Post v1.0.0 |

## Gelombang delivery

| Gelombang | Fokus |
|-----------|--------|
| **W0** | ✅ Inti MVP lokal |
| **W1** | F-10 email + Redis — [PLAN Wave 1](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/PLAN-Wave-1-Email.md) |
| **W2** | F-01 staging + deploy |
| **W3** | QA, E2E, KPI, RC **v1.0.0** |
| **W4+** | F-12, enhancement |

Rencana penuh: [PLAN-MVP-Delivery](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/PLAN-MVP-Delivery.md)

## UX (paralel)

Epic GitHub [#30 UI enhance](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/30) — token & kit UI (#31–#32 selesai).
