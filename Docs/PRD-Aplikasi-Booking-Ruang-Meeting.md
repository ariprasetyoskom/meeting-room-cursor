# Product Requirements Document (PRD)
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | PRD-Aplikasi-Booking-Ruang-Meeting |
| **Versi** | **1.1** |
| **Tanggal** | 29 September 2026 |
| **Status** | Approved for MVP build |
| **Dokumen Terkait** | [BRD](./BRD-Aplikasi-Booking-Ruang-Meeting.md) · [TDD](./TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) · [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md) |

---

## 1. Ringkasan Produk

Aplikasi web internal untuk memesan ruang meeting: discover ruang, lihat kalender, buat/cancel reservasi, notifikasi email. MVP deliverable dalam ~11 minggu (lihat BRD timeline). PRD ini mengunci keputusan produk, fitur F-01–F-12, dan open question tersisa.

---

## 2. Persona

| Persona | Kebutuhan utama |
|---------|-----------------|
| **Employee** | Booking cepat, lihat kosong, tahu siapa punya slot |
| **Facilities Admin** | Kelola ruang, override cancel, export dasar |
| **IT Admin** | Auth, env, monitoring (non-UI MVP) |

---

## 3. Keputusan Produk (Locked)

| ID | Keputusan | Implikasi |
|----|-----------|-----------|
| **D-1** | **Cancel hanya restricted** — hanya organizer yang boleh cancel; window ≥ 1 jam sebelum start; admin override dengan alasan wajib. Tidak ada cancel oleh peserta/non-organizer. | UI: tombol cancel hanya untuk organizer; API: enforce `organizer_user_id === session.user.id` kecuali role admin. |
| **D-2** | **Nama organizer ditampilkan** pada kalender ruang dan detail booking publik (authenticated). | Gunakan `display_name` dari profil; tidak anonim di shared calendar. |
| **D-3** | **Email bilingual** — setiap notifikasi transaksional memuat section Bahasa Indonesia dan English dalam satu email (bukan dua email terpisah). | Template email dual-block; subject line bilingual singkat. |

Keputusan teknis turunan: lihat [TDD](./TDD-Aplikasi-Booking-Ruang-Meeting.md).

---

## 4. Fitur (F-01 – F-12)

| ID | Fitur | Deskripsi | MVP | Catatan |
|----|-------|-----------|-----|---------|
| **F-01** | Login & session | Auth karyawan; session persist; logout | Yes | OIDC atau email+magic link per IT |
| **F-02** | Daftar ruang | Browse ruang aktif; filter kapasitas/lantai | Yes | |
| **F-03** | Detail ruang | Kapasitas, amenities, foto opsional | Yes | Foto Could jika asset ready |
| **F-04** | Kalender ruang | View day/week; occupied shows title + organizer name (D-2) | Yes | |
| **F-05** | Buat booking | Form: ruang, title, start, end, description | Yes | Validasi BR-01–04 |
| **F-06** | Booking saya | List upcoming/history; link ke detail | Yes | |
| **F-07** | Cancel booking | Restricted cancel (D-1); confirm modal | Yes | |
| **F-08** | Admin ruang | CRUD ruang; activate/deactivate | Yes | |
| **F-09** | Admin bookings | List all; admin cancel + reason | Yes | BR-08 |
| **F-10** | Email notifications | Confirm, cancel, reminder — bilingual (D-3) | Yes | Async via queue |
| **F-11** | Audit trail | View log admin untuk booking/room changes | Yes | MVP: table + filter date |
| **F-12** | Export CSV | Admin export bookings by date range | Could | Post-MVP jika capacity |

---

## 5. Out of Scope (MVP)

- Calendar sync (Google/M365)
- Recurring meetings
- Mobile native apps
- Public anonymous booking
- Payment / billing ruang

---

## 6. UX & Content

Spesifikasi layar lengkap: [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md).

- Bahasa UI utama: **Indonesia** (`lang="id"`); datetime **WIB**.
- Nav: **Booking** (`/book`), **Ruang** (`/rooms`), **Booking saya** (`/bookings`).
- **Pilih ruangan:** grid 5 ruang demo (MR-A … MR-E) + opsi **Semua ruang**; filter timeline.
- Kalender: view **Timeline** / **Daftar**; slot terisi menampilkan organizer (D-2).
- Booking: modal dengan dropdown ruang; tanpa optimistic submit.
- Empty states dengan CTA ke `/book`.
- Error bentrok: *"Ruangan sudah dipesan pada waktu ini"*.
- Cancel denied: window **1 jam** (D-1) atau bukan organizer.

---

## 7. Metrik Produk

- Funnel: view calendar → start booking → success.
- Events: `booking_created`, `booking_cancelled`, `booking_conflict`.
- Dashboard PO: weekly active bookers, conflict rate.

---

## 8. Dependencies

- IdP / SSO credentials (IT)
- SMTP atau email provider (Ops)
- Daftar ruang awal dari Facilities
- [Devops docker stack](../Devops/docker/docker-compose.yml) untuk dev local

---

## 9. Open Questions

| ID | Pertanyaan | Status |
|----|------------|--------|
| OQ-1 | Provider SSO final? | Resolved via IT — OIDC generic |
| OQ-2 | Reminder offset (1 jam vs 24 jam)? | Default 1 jam before; config env |
| OQ-3 | Foto ruang MVP? | Optional; defer if no assets |
| **OQ-4** | **PWA** (installable, offline cache) untuk Fase 2? | **Open** — evaluasi setelah MVP adoption; lihat BRD Fase 2 |

Hanya **OQ-4** tetap terbuka di versi dokumen ini.

---

## 10. Release Criteria

- Semua fitur F-01–F-11 lulus QA checklist Architecture §8.6.
- D-1, D-2, D-3 verified in UAT sign-off.
- Zero P1 bugs; load test 100 concurrent users on staging.

---

## 11. Dokumen Terkait

| Dokumen | Path |
|---------|------|
| Business Requirements | [./BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) |
| Technical Design | [./TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) |
| Architecture v1.2 | [./Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| Design | [./Design-Aplikasi-Booking-Ruang-Meeting.md](./Design-Aplikasi-Booking-Ruang-Meeting.md) |

---

*Akhir dokumen PRD v1.1.*
