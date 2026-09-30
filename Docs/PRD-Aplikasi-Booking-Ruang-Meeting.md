# Product Requirements Document (PRD)
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | PRD-Aplikasi-Booking-Ruang-Meeting |
| **Versi** | **1.4** |
| **Tanggal** | 30 September 2026 |
| **Status** | MVP **fungsional lokal** (F-02–F-09, F-11 + F-04); **release-ready** setelah W1–W3 — [PLAN-MVP-Delivery](./PLAN-MVP-Delivery.md) |
| **Dokumen Terkait** | [BRD](./BRD-Aplikasi-Booking-Ruang-Meeting.md) · [PLAN](./PLAN-MVP-Delivery.md) · [PLAN-UI-Enhance](./PLAN-UI-Enhance.md) · [TDD](./TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) · [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md) |

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

### 4.1 Status implementasi (snapshot engineering)

Snapshot **30 Sep 2026** — commit terbaru di branch `cursor/meeting-room-web-scaffold`: `b2ef14c` (pushed). Selarasan gelombang: **§4.3**.

| ID | Status MVP | Bukti singkat | Gap utama |
|----|------------|---------------|-----------|
| **F-01** | **Sebagian** | Dev auth + OIDC (Auth.js), session, logout | UAT IdP **staging** (W2) |
| **F-02** | **Selesai** | `/rooms`, `RoomDirectory`, filter kapasitas | UX polish pararel [UI-07](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/37) |
| **F-03** | **Sebagian** | Kartu + picker di `/book` & `/rooms` | Halaman `/rooms/[code]` (W3 / PLN-007, [UI-09](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/39)); foto OQ-3 optional |
| **F-04** | **Selesai** | Hari / Minggu / Daftar; 07–21 WIB; organizer (D-2) | UX [UI-04–05](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/34); week multi-ruang → W4+ |
| **F-05** | **Selesai** | `BookingModal`, POST booking, BR-01–04; enqueue email **tidak** mem-500 setelah commit DB (`b2ef14c`) | UX [UI-06](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/36); konfirmasi email tetap tergantung F-10 |
| **F-06** | **Selesai** | `/bookings`, `MyBookingsList` | UX [UI-07](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/37) |
| **F-07** | **Selesai** | Cancel organizer + window D-1; admin + alasan | Email cancel → F-10 (W1) |
| **F-08** | **Selesai** | `/admin/rooms`, CRUD, activate/deactivate | UX [UI-08](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/38) |
| **F-09** | **Selesai** | `/admin/bookings`, admin cancel + alasan | UX [UI-08](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/38) |
| **F-10** | **Sebagian** | Worker + enqueue confirm; gagal Redis di-log (booking tetap 201) | **Must W1:** SMTP, template D-3, cancel + reminder, Redis staging — [PLAN-Wave-1-Email](./PLAN-Wave-1-Email.md) |
| **F-11** | **Selesai** | `/admin/audit`, filter tanggal | UX [UI-08](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/38) |
| **F-12** | **Belum** | — | Post v1.0.0 (W4+, PLN-010) |

Repo: [github.com/ariprasetyoskom/meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor). Setup lokal: [000_platform_setup §9](./000_platform_setup/PRD-Platform-Environment-Setup.md).

**Legenda status MVP:** **Selesai** = alur FR inti ada di dev; **Sebagian** = ada gap Must/Should sebelum sign-off §10; **Belum** = out of scope rilis v1.0.0.

### 4.2 Perencanaan release (ringkas)

Detail sprint, gelombang, dan backlog: **[PLAN-MVP-Delivery v1.0](./PLAN-MVP-Delivery.md)**.

| Gelombang | Fokus | Target |
|-----------|-------|--------|
| **W0** | Inti MVP + F-04 Minggu + perbaikan dev (auth secret, DB timeout, booking vs Redis) | ✅ Selesai (lokal) |
| **W1** | F-10 email bilingual + Redis ([ticket](./PLAN-Wave-1-Email.md)) | Sprint S4 — **blok Must** |
| **W2** | F-01 OIDC staging + deploy | Sprint S5 |
| **W3** | QA §8.6, E2E, KPI §7, F-03 detail (Should), RC v1.0.0 | Sprint S6 |
| **W4+** | F-12, enhancement kalender, Fase 2 | Post go-live |

**Must sebelum v1.0.0:** PLN-001 … PLN-005 (lihat PLAN §5).

**Jalur pararel UX (non-blok rilis, epic [#30](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/30)):** fondasi token + kit UI ✅ ([UI-01](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/31), [UI-02](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/32)); shell & `/book` → [PLAN-UI-Enhance](./PLAN-UI-Enhance.md). Tidak mengganti scope F-xx Must.

### 4.3 Selarasan fitur × gelombang × backlog

Sumber kebenaran delivery: [PLAN-MVP-Delivery §2–§5](./PLAN-MVP-Delivery.md). PRD §4.1 = **what**; tabel ini = **when / ticket**.

| ID | Fitur | Status impl. | Gelombang selesai | Gelombang / sprint berikut | Backlog kunci | Gate rilis (PRD §10) |
|----|-------|--------------|-------------------|----------------------------|---------------|----------------------|
| **F-01** | Login & session | Sebagian | W0 (dev) | **W2** S5 | PLN-002, W2-01–03 | G3 OIDC UAT |
| **F-02** | Daftar ruang | Selesai | W0 | — (UX UI-07) | — | G1 |
| **F-03** | Detail ruang | Sebagian | W0 (kartu) | **W3** Should | PLN-007, UI-09, W3 opsional | G1 (teks); foto OQ-3 Could |
| **F-04** | Kalender | Selesai | W0 | — (UX UI-04–05) | PLN-011 Could | G1, D-2 |
| **F-05** | Buat booking | Selesai | W0 (+ fix enqueue `b2ef14c`) | — (UX UI-06) | — | G1, BR-01–04 |
| **F-06** | Booking saya | Selesai | W0 | — (UX UI-07) | — | G1 |
| **F-07** | Cancel | Selesai | W0 | Notifikasi **W1** | PLN-001 (email cancel) | G1, D-1 |
| **F-08** | Admin ruang | Selesai | W0 | — (UX UI-08) | — | G1 |
| **F-09** | Admin bookings | Selesai | W0 | — (UX UI-08) | — | G1, BR-08 |
| **F-10** | Email | Sebagian | W0 (queue/worker) | **W1** S4 Must | PLN-001, PLN-009, Wave-1 #1–29 | G2 **D-3**, BRD §13 email |
| **F-11** | Audit | Selesai | W0 | — (UX UI-08) | — | G1 |
| **F-12** | Export CSV | Belum | — | **W4+** Could | PLN-010 | Di luar v1.0.0 Must |

**Non-fitur (PRD §7) — W3:** PLN-006 / W3-04 (event `booking_*`); PLN-004 / W3-02 (Playwright); PLN-008 / W3-03 (k6).

**Keputusan produk terkunci vs rencana:** D-1 & D-2 ✅ di dev; **D-3** menunggu penutupan **F-10** (W1).

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

- Bahasa UI utama: **Indonesia** (`lang="id"`); datetime **WIB**; tipografi **Geist Sans** (`layout.tsx` variabel di `<html>`).
- **App shell:** header sticky + blur, **logo** (`BrandLogo`) + brand *Ruang Meeting* / tagline *Booking internal*; nav segmented pill (`MainNav`, `AdminNav`); profil `UserMenu` + `SessionProfileProvider`; dev: `DevAuthBanner`. Detail: [Design §5](./Design-Aplikasi-Booking-Ruang-Meeting.md).
- Nav: **Booking** (`/book`), **Ruang** (`/rooms`), **Booking saya** (`/bookings`); admin (role): `/admin/rooms`, `/admin/bookings`, `/admin/audit`.
- **Pilih ruangan:** grid 5 ruang demo (MR-A … MR-E) + opsi **Semua ruang**; filter kapasitas + timeline.
- Kalender: view **Hari** (timeline multi-ruang) / **Minggu** (grid 7 hari, satu ruang terpilih) / **Daftar**; slot terisi + organizer (D-2).
- Booking: modal dengan dropdown ruang; tanpa optimistic submit; komponen form memakai kit UI (`Field`, `Input`, `Button`, `Alert`) — [Design §5.1](./Design-Aplikasi-Booking-Ruang-Meeting.md); migrasi layar lain di epic UI.
- Error API booking: bentrok 409 dengan copy PRD; kegagalan server generik — perbaiki pesan JSON (backlog QA).
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

- Semua fitur **F-01–F-11** lulus QA checklist Architecture §8.6 — lihat matriks penutupan **§4.3** (posisi: **8/11** fungsional penuh di dev; **F-01**, **F-03** (Should), **F-10** Must belum sign-off).
- **D-1**, **D-2** verified di dev/UAT; **D-3** menunggu penutupan **F-10** Wave **W1**.
- Zero P1 bugs (termasuk regresi booking POST vs Redis — diperbaiki `b2ef14c`); load test 100 concurrent users on staging (W3).
- CI **GitHub Actions** hijau pada branch release / `main` ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) — develop aktif: `cursor/meeting-room-web-scaffold`.

---

## 11. Dokumen Terkait

| Dokumen | Path |
|---------|------|
| Business Requirements | [./BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) |
| **Rencana delivery MVP** | [./PLAN-MVP-Delivery.md](./PLAN-MVP-Delivery.md) |
| **Rencana UI enhance** | [./PLAN-UI-Enhance.md](./PLAN-UI-Enhance.md) |
| Wave 1 email (F-10) | [./PLAN-Wave-1-Email.md](./PLAN-Wave-1-Email.md) |
| Technical Design | [./TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) |
| Architecture v1.3 | [./Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| Design v1.1 | [./Design-Aplikasi-Booking-Ruang-Meeting.md](./Design-Aplikasi-Booking-Ruang-Meeting.md) |
| Release notes | [./RELEASE-NOTES.md](./RELEASE-NOTES.md) |

---

*Akhir dokumen PRD v1.4.*
