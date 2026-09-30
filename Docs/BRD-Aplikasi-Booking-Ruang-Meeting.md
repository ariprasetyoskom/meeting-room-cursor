# Business Requirements Document (BRD)
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | BRD-Aplikasi-Booking-Ruang-Meeting |
| **Versi** | **1.1** |
| **Tanggal** | 29 September 2026 |
| **Status** | Draft untuk Review |
| **Bahasa** | Indonesia |
| **Dokumen Terkait** | [PRD](./PRD-Aplikasi-Booking-Ruang-Meeting.md) · [TDD](./TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) · [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md) |

---

## 1. Executive Summary

Organisasi membutuhkan sistem terpusat untuk memesan ruang meeting agar konflik jadwal, double booking, dan ketidakjelasan kepemilikan reservasi dapat dihilangkan. Aplikasi Booking Ruang Meeting akan menyediakan katalog ruang, kalender ketersediaan real-time, alur pemesanan dengan validasi bentrok waktu, notifikasi email bilingual (Indonesia/Inggris), dan kebijakan pembatalan yang terkontrol.

Solusi ini ditargetkan untuk karyawan internal (employee self-service) dengan peran admin fasilitas untuk mengelola master data ruang dan kebijakan. MVP fokus pada booking, cancel terbatas, dan visibilitas nama organizer; fase berikutnya menambahkan integrasi kalender, approval workflow, dan analitik utilisasi.

**Manfaat bisnis utama:**

- Mengurangi waktu koordinasi manual (chat/email) untuk cek ketersediaan ruang.
- Meningkatkan utilisasi ruang meeting melalui visibilitas slot kosong.
- Audit trail reservasi untuk compliance dan perencanaan kapasitas.
- Pengalaman konsisten di desktop dan mobile web.

---

## 2. KPI & Metrik Sukses

| KPI | Definisi | Target MVP (90 hari) | Pemilik |
|-----|----------|----------------------|---------|
| **Adopsi aktif** | % karyawan eligible yang ≥1 booking | ≥ 60% | HR / Workplace |
| **Double booking** | Insiden bentrok ruang yang terkonfirmasi sistem | 0 | IT / Facilities |
| **Waktu booking** | Median waktu selesai 1 reservasi (login → konfirmasi) | ≤ 2 menit | Product |
| **Tingkat pembatalan** | Cancel / total booking | ≤ 15% (monitor, bukan hard fail) | Facilities |
| **Kepuasan pengguna** | Skor CSAT survei pasca-MVP | ≥ 4.0 / 5.0 | Product |
| **Uptime layanan** | Availability jam kerja (08:00–18:00 WIB) | ≥ 99.5% | IT Operations |

---

## 3. Ruang Lingkup

### 3.1 MVP (Fase 1)

- Autentikasi karyawan (SSO atau email domain per keputusan IT).
- Daftar ruang meeting dengan kapasitas, lokasi lantai, fasilitas (proyektor, VC).
- Kalender ruang: tampilan harian/mingguan, slot terisi vs kosong.
- Buat booking: judul, waktu mulai/selesai, ruang, deskripsi opsional.
- Validasi anti-bentrok di server (tidak boleh overlap untuk ruang yang sama).
- Pembatalan **hanya** oleh organizer dalam window yang diizinkan (lihat BR-03, keputusan D-1 di PRD).
- Tampilkan **nama organizer** pada detail booking publik di kalender (D-2).
- Email konfirmasi, reminder, dan notifikasi cancel **bilingual** ID/EN (D-3).
- Admin: CRUD ruang, nonaktifkan ruang, lihat semua booking.
- Audit log dasar (siapa, apa, kapan).

### 3.2 Fase 2 (Out of Scope MVP)

- Integrasi Google Calendar / Microsoft 365 (two-way sync).
- Workflow approval untuk ruang premium / kapasitas besar.
- Recurring meeting dan exception dates.
- Check-in di ruang (QR) dan auto-release no-show.
- Waiting list saat ruang penuh.
- Dashboard utilisasi, heatmap, export BI.
- PWA offline-first (lihat OQ-4 di PRD).
- Multi-site / multi-timezone enterprise.

---

## 4. Stakeholder

| Stakeholder | Peran | Minat | Engagement |
|-------------|-------|-------|------------|
| **Karyawan (End User)** | Pemesan ruang | Booking cepat, lihat kosong | UAT, beta |
| **Facilities / Workplace** | Pemilik proses ruang | Utilisasi, kebijakan cancel | BR sign-off, UAT |
| **IT Security** | Governance | SSO, data privacy | Review arsitektur |
| **IT Operations** | Hosting & SLA | Monitoring, backup | Runbook |
| **HR** | Kebijakan karyawan | Adopsi, komunikasi | Change management |
| **Legal / Compliance** | Retensi data | Log, GDPR-like | Review kebijakan |
| **Product Owner** | Prioritas backlog | MVP on-time | Daily dengan tim dev |
| **Engineering Lead** | Delivery | Feasibility teknis | TDD & Architecture |

---

## 5. Aturan Bisnis (Business Rules)

| ID | Aturan | Prioritas |
|----|--------|-----------|
| **BR-01** | Satu ruang tidak boleh memiliki dua booking yang overlap waktu (interval `[start, end)`). | Must |
| **BR-02** | Booking hanya dapat dibuat untuk waktu **masa depan**; minimal 15 menit sebelum `start` (configurable admin). | Must |
| **BR-03** | Pembatalan hanya diizinkan oleh **organizer** reservasi, dan hanya jika ≥ 1 jam sebelum `start` (kecuali role Admin Facilities override). | Must |
| **BR-04** | Durasi booking minimum 30 menit, maksimum 8 jam per sesi (configurable). | Must |
| **BR-05** | Ruang **nonaktif** tidak muncul di picker booking dan tidak menerima booking baru. | Must |
| **BR-06** | Nama organizer ditampilkan pada event di kalender bersama ruang (transparansi kepemilikan). | Must |
| **BR-07** | Email notifikasi wajib dikirim dalam bahasa Indonesia **dan** Inggris dalam satu message (bilingual). | Must |
| **BR-08** | Admin Facilities dapat membatalkan booking kapan saja dengan alasan wajib (audit). | Should |
| **BR-09** | Maksimal 2 booking aktif future per user per hari per ruang (anti hoarding); dapat dinonaktifkan via config. | Should |
| **BR-10** | Data booking disimpan minimal 24 bulan untuk pelaporan utilisasi. | Must |

---

## 6. Functional Requirements (FR)

### 6.1 Autentikasi & Profil

| FR ID | Deskripsi | Prioritas | BR Ref |
|-------|-----------|-----------|--------|
| FR-01 | User login via mekanisme auth yang disetujui IT | Must | — |
| FR-02 | Profil menampilkan nama lengkap yang dipakai sebagai organizer | Must | BR-06 |
| FR-03 | Role `employee` vs `admin` menentukan akses menu admin | Must | — |

### 6.2 Master Ruang

| FR ID | Deskripsi | Prioritas | BR Ref |
|-------|-----------|-----------|--------|
| FR-04 | Admin dapat menambah/edit/nonaktifkan ruang | Must | BR-05 |
| FR-05 | Ruang memiliki: kode, nama, lokasi, kapasitas, daftar fasilitas | Must | — |
| FR-06 | Karyawan melihat daftar ruang aktif dengan filter kapasitas/lokasi | Must | — |

### 6.3 Booking

| FR ID | Deskripsi | Prioritas | BR Ref |
|--------------|-----------|--------|
| FR-07 | User membuat booking dengan ruang, judul, start, end | Must | BR-01, BR-02, BR-04 |
| FR-08 | Sistem menolak booking bentrok dengan pesan jelas | Must | BR-01 |
| FR-09 | User melihat booking sendiri (upcoming & history) | Must | — |
| FR-10 | Organizer dapat cancel booking sesuai BR-03 | Must | BR-03 |
| FR-11 | Kalender ruang menampilkan slot terisi + nama organizer | Must | BR-06 |
| FR-12 | Admin melihat semua booking dan dapat override cancel | Should | BR-08 |

### 6.4 Notifikasi

| FR ID | Deskripsi | Prioritas | BR Ref |
|-------|-----------|-----------|--------|
| FR-13 | Email konfirmasi saat booking dibuat | Must | BR-07 |
| FR-14 | Email reminder H-1 jam sebelum meeting (configurable) | Should | BR-07 |
| FR-15 | Email saat pembatalan (organizer atau admin) | Must | BR-07 |

### 6.5 Audit & Reporting (MVP minimal)

| FR ID | Deskripsi | Prioritas | BR Ref |
|-------|-----------|-----------|--------|
| FR-16 | Log aksi: create/cancel booking, perubahan ruang | Must | BR-10 |
| FR-17 | Export CSV booking per rentang tanggal (admin) | Could | BR-10 |

---

## 7. Non-Functional Requirements (NFR)

| Kategori | Requirement |
|----------|-------------|
| **Performance** | Halaman kalender ruang TTFB < 500 ms (P95) di jaringan kantor; create booking < 1 s (P95). |
| **Availability** | 99.5% jam kerja; RTO 4 jam, RPO 1 jam (backup DB harian + WAL). |
| **Security** | HTTPS only; OWASP Top 10 mitigasi; RBAC; tidak expose PII di URL. |
| **Privacy** | Hanya karyawan terautentikasi melihat detail booking ruang; email hanya ke organizer terkait event. |
| **Accessibility** | WCAG 2.1 AA untuk alur booking utama. |
| **Localization** | UI default Bahasa Indonesia; email bilingual ID+EN. |
| **Scalability** | Mendukung ≥ 500 ruang dan 10.000 booking/bulan tanpa redesign. |
| **Maintainability** | Dokumentasi API OpenAPI; migrasi DB versioned. |

---

## 8. User Journeys

### 8.1 Journey: Karyawan — Booking Ruang Kosong

1. Login ke aplikasi.
2. Buka menu **Booking** (`/book`).
3. **Pilih ruangan** (satu dari 5 ruang atau **Semua ruang**); pilih tanggal; lihat slot kosong vs terisi (nama organizer pada slot terisi — D-2).
4. Isi judul meeting, waktu mulai/selesai.
5. Submit; sistem validasi bentrok dan aturan BR.
6. Terima email bilingual konfirmasi.
7. Meeting muncul di **Booking Saya**.

**Pain points yang diatasi:** tidak perlu tanya rekan via chat; bentrok dicegah di server.

### 8.2 Journey: Karyawan — Cancel Sebelum Meeting

1. Buka **Booking Saya** → pilih upcoming.
2. Klik **Batalkan** (enabled jika ≥ 1 jam sebelum start dan user adalah organizer).
3. Konfirmasi dialog.
4. Slot ruang bebas; email bilingual cancel terkirim.

### 8.3 Journey: Admin Facilities — Nonaktifkan Ruang Renovasi

1. Login sebagai admin.
2. **Master Ruang** → edit ruang → status Nonaktif + catatan.
3. Ruang hilang dari picker karyawan; booking future existing ditangani manual ( komunikasi ) atau bulk cancel (Fase 2 tool ).

### 8.4 Journey: Karyawan — Gagal Booking Bentrok

1. User pilih slot yang overlap booking existing.
2. Sistem menampilkan error: ruang tidak tersedia, saran waktu alternatif (opsional MVP: pesan saja).
3. User adjust waktu atau pilih ruang lain.

---

## 9. Model Data Konseptual

```text
User (1) ──< Booking (N) >── (1) Room
                │
                └── AuditLog (N)

Room: id, code, name, floor, capacity, amenities[], is_active
User: id, email, display_name, role
Booking: id, room_id, organizer_user_id, title, description, start_at, end_at, status (confirmed|cancelled), cancelled_at, cancelled_by, cancel_reason
AuditLog: id, actor_user_id, entity_type, entity_id, action, payload_json, created_at
```

**Constraint bisnis kritis:** tidak ada dua booking `confirmed` untuk `room_id` yang overlap interval waktu.

---

## 10. Arsitektur & Tech Stack (Selaras MVP)

Detail teknis: [TDD v1.1](./TDD-Aplikasi-Booking-Ruang-Meeting.md), [Architecture v1.2](./Architecture-Aplikasi-Booking-Ruang-Meeting.md), pengalaman UI: [Design](./Design-Aplikasi-Booking-Ruang-Meeting.md).

| Aspek | Keputusan baseline |
|-------|-------------------|
| Monorepo | `Docs/`, `Apps/web/`, `Devops/` |
| Frontend | Next.js **14** App Router, React **18**, TypeScript **5** |
| UI | CSS design tokens + Geist; 5 ruang selectable (`RoomPicker`) |
| Backend | Route handlers `/api/v1` dalam app yang sama |
| ORM / DB | **Drizzle ORM** + PostgreSQL **15**, **exclusion constraint** anti-overlap |
| Queue | Redis **7** + BullMQ — email bilingual async (D-3) |
| Auth | Auth.js — **OIDC** + mode **dev** lokal |
| Dev infra | Docker Postgres **5434**, Redis **6379** |
| Hosting | Container staging/prod; **CI/CD GitHub Actions** (`.github/workflows/`, `Devops/ci/`) |

---

## 11. Timeline Indikatif

| Fase | Durasi | Deliverable |
|------|--------|-------------|
| Discovery & sign-off BRD/PRD | 2 minggu | Dokumen approved |
| Design & spike DB constraint | 1 minggu | TDD v1, migration POC |
| Sprint 1–2: Auth, rooms, booking CRUD | 4 minggu | MVP core di staging |
| Sprint 3: Email, admin, audit | 2 minggu | Feature complete MVP |
| UAT & hardening | 2 minggu | Production go-live |
| **Total MVP** | **~11 minggu** | — |

Fase 2 direncanakan setelah evaluasi KPI 90 hari post go-live.

---

## 12. Risiko

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Delay integrasi SSO | Go-live slip | Mock auth dev; parallel track dengan IT IdP |
| Timezone / DST edge cases | Booking salah jam | Simpan UTC; tampilkan TZ kantor; test cases |
| Abuse booking (hoarding) | Ruang idle | BR-09; monitoring utilisasi |
| Email deliverability | User tidak dapat konfirmasi | SPF/DKIM; retry queue BullMQ |
| Scope creep Fase 2 ke MVP | Overrun | Change control via PO; PRD scope lock |

---

## 13. Acceptance Criteria (MVP)

- [ ] Tidak mungkin membuat dua booking confirmed overlap untuk ruang yang sama (bukti test + constraint DB).
- [ ] Non-organizer tidak dapat cancel booking user lain (kecuali admin dengan alasan).
- [ ] Cancel organizer diblokir < 1 jam sebelum start (pesan error jelas).
- [ ] Kalender menampilkan nama organizer pada setiap slot terisi.
- [ ] Email create/cancel/reminder memuat blok teks ID dan EN.
- [ ] Admin dapat nonaktifkan ruang; ruang tidak muncul di flow booking karyawan.
- [ ] Audit log tercatat untuk create/cancel dan perubahan ruang.
- [ ] KPI instrumentation (minimal event analytics) terpasang untuk adopsi dan durasi booking.

---

## 14. User Stories (Backlog Referensi)

| ID | Story | Acceptance hint |
|----|-------|-----------------|
| US-01 | Sebagai karyawan, saya ingin melihat ketersediaan ruang per hari agar saya bisa memilih slot kosong. | Kalender per ruang, legend occupied/free |
| US-02 | Sebagai karyawan, saya ingin membooking ruang dengan judul dan waktu agar tim tahu agenda. | FR-07, email confirm |
| US-03 | Sebagai karyawan, saya ingin melihat siapa yang membooking slot agar saya bisa koordinasi. | Nama organizer visible |
| US-04 | Sebagai organizer, saya ingin membatalkan booking jika meeting batal agar ruang freed. | BR-03, D-1 |
| US-05 | Sebagai sistem, saya harus menolak double booking agar tidak ada konflik di ruang. | BR-01, exclusion constraint |
| US-06 | Sebagai admin, saya ingin mengelola daftar ruang agar data kapasitas/fasilitas akurat. | FR-04 |
| US-07 | Sebagai admin, saya ingin membatalkan booking darurat dengan alasan agar operasional ruang terjaga. | BR-08 |
| US-08 | Sebagai karyawan, saya ingin menerima email bilingual agar saya paham detail tanpa harus buka app. | D-3 |
| US-09 | Sebagai compliance, saya ingin log perubahan booking agar audit trail tersedia. | FR-16 |
| US-10 | Sebagai PO, saya ingin metrik adopsi agar KPI dapat diukur post launch. | KPI dashboard minimal |

---

## 15. Dokumen Terkait

| Dokumen | Path |
|---------|------|
| Product Requirements | [./PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) |
| Technical Design | [./TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) |
| Architecture v1.2 | [./Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| Design (UI/UX) | [./Design-Aplikasi-Booking-Ruang-Meeting.md](./Design-Aplikasi-Booking-Ruang-Meeting.md) |
| Indeks Docs | [./README.md](./README.md) |

---

## 16. Sign-off

| Nama | Jabatan | Tanggal | Tanda |
|------|---------|---------|-------|
| __________________ | Product Owner | | |
| __________________ | Facilities Lead | | |
| __________________ | IT Representative | | |
| __________________ | Engineering Lead | | |

---

## 17. Glosarium

| Istilah | Definisi |
|---------|----------|
| **Booking** | Reservasi ruang meeting untuk interval waktu tertentu. |
| **Organizer** | User yang membuat booking; pemilik reservasi untuk kebijakan cancel. |
| **Overlap** | Dua interval waktu yang berpotongan; dilarang untuk ruang yang sama. |
| **Bilingual email** | Satu email berisi konten paralel Bahasa Indonesia dan English. |
| **MVP** | Minimum Viable Product — cakupan Fase 1. |
| **Facilities** | Tim workplace yang mengelola ruang fisik dan kebijakan utilisasi. |
| **Exclusion constraint** | Constraint PostgreSQL mencegah overlap range pada level database. |
| **SSO** | Single Sign-On — login terpusat perusahaan. |

---

*Akhir dokumen BRD.*
