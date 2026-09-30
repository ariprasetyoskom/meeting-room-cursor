# Design Document — UI/UX & Visual
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | Design-Aplikasi-Booking-Ruang-Meeting |
| **Versi** | **1.1** |
| **Tanggal** | 30 September 2026 |
| **Status** | Selaras implementasi `Apps/web` — PRD v1.4, Architecture v1.3 |
| **Dokumen Terkait** | [BRD v1.2](./BRD-Aplikasi-Booking-Ruang-Meeting.md) · [PRD v1.2](./PRD-Aplikasi-Booking-Ruang-Meeting.md) · [TDD v1.1](./TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture v1.3](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |

---

## 1. Tujuan

Mendeskripsikan pengalaman pengguna, struktur layar, pola interaksi, dan sistem visual untuk MVP — selaras dengan keputusan produk **D-1–D-3** (PRD) dan implementasi komponen di `Apps/web`.

---

## 2. Prinsip UX

| Prinsip | Aplikasi |
|---------|----------|
| **Cepat** | Alur utama: pilih ruang → lihat slot → booking ≤ 2 menit (BRD KPI). |
| **Transparan** | Slot terisi menampilkan judul + **nama organizer** (D-2). |
| **Aman dari bentrok** | Tidak ada optimistic create; tunggu respons 201/409 (TDD §8.2). |
| **Bahasa Indonesia** | UI `lang="id"`; format tanggal/waktu WIB. |
| **Aksesibilitas** | Modal dengan `role="dialog"`; room picker `listbox` + `aria-selected`. Target WCAG 2.1 AA pada alur booking (BRD NFR). |

---

## 3. Informasi Arsitektur UI

| Aspek | Keputusan |
|-------|-----------|
| Framework | Next.js 14 App Router — halaman server + komponen client untuk kalender/modal |
| Styling | **CSS Modules global** (`globals.css`) dengan **design tokens** CSS variables; tanpa utility framework |
| Tipografi | **Geist Sans** (judul/nav/body), Geist Mono (opsional kode) via `next/font/local` |
| Tema | Light default; **dark mode** otomatis via `prefers-color-scheme` |
| Ikon / brand | Logo SVG `BrandLogo` + favicon `app/icon.svg`; slot status tetap warna hijau/merah |

Detail stack lengkap: [TDD §2](./TDD-Aplikasi-Booking-Ruang-Meeting.md).

---

## 4. Design Tokens (Visual)

Definisi di `Apps/web/src/app/globals.css`:

Setiap pasangan teks/latar menjaga kontras **≥ 4.5:1** (WCAG AA teks normal) di light dan dark. Komponen **tidak** memakai warna hex langsung — selalu lewat token (pengecualian: gradien brand `BrandLogo`).

| Token | Light | Dark | Penggunaan |
|-------|-------|------|------------|
| `--bg` / `--surface` | `#f4f6f9` / `#ffffff` | `#0b1120` / `#111827` | Latar aplikasi / kartu, header, modal |
| `--text` / `--muted` | `#0f172a` / `#58687e` | `#f1f5f9` / `#94a3b8` | Body / hint, organizer di slot |
| `--border` / `--border-strong` | `#e2e8f0` / `#cbd5e1` | `#1e293b` / `#334155` | Kartu / input, tombol sekunder, segmented |
| `--primary` / `--on-primary` | `#2563eb` / `#fff` | `#60a5fa` / `#0b1120` | CTA, link aktif, seleksi / teks di atas primary |
| `--focus-ring` | primary 55% | primary 55% | Outline `:focus-visible` (btn, input, slot, picker) |
| `--danger` / `--on-danger` | `#dc2626` / `#fff` | `#f87171` / `#0b1120` | Tombol destruktif |
| `--danger-bg/-fg/-border` | merah muda / `#991b1b` | `#450a0a` / `#fecaca` | `.alert-error` |
| `--success` / `--success-bg` | `#047857` / `#ecfdf5` | `#34d399` / hijau 14% | `.badge-success` |
| `--warning-bg/-fg/-border` | `#fef3c7` / `#78350f` | `#422006` / `#fde68a` | `DevAuthBanner` |
| `--slot-free` / `--slot-free-border` | `#dcfce7` / `#86efac` | hijau 14% / 35% | Sel kosong (border agar terlihat di atas putih) |
| `--slot-busy` / `--slot-busy-border` | `#fee2e2` / `#f87171` | merah 22% / `#f87171` | Sel terisi + aksen kiri 3px (tidak hanya warna) |
| `--overlay` | slate 45% | hitam 60% | Backdrop modal |
| `--radius` / `--radius-sm` / `--radius-pill` | `10px` / `8px` / `999px` | — | Kartu & modal / input, tombol, alert / nav pill |
| `--shadow` / `--shadow-lg` | subtle / modal | lebih pekat | Elevasi header & kartu / modal |

`color-scheme` diset per tema sehingga kontrol native (date picker, scrollbar) ikut gelap.

---

## 5. Layout & Navigasi

### 5.1 App shell

Komponen: `AppShell` — header **sticky** + backdrop blur, brand **Ruang Meeting** dengan `BrandLogo`, tagline *Booking internal*, nav **segmented pill** (`MainNav`, `AdminNav` dalam `.app-nav-scroll` horizontal di mobile). `DevAuthBanner` **di dalam** `<header>` (sticky bersama bar atas) + `.dev-banner-inner` selaras lebar konten — konten tidak tertutup banner. `UserMenu`: avatar inisial + slot lebar tetap (UI-03).

| Route | Label nav | Fungsi (PRD) |
|-------|-----------|--------------|
| `/book` | Booking | F-04 kalender + F-05 buat booking |
| `/rooms` | Ruang | F-02 daftar ruang |
| `/bookings` | Booking saya | F-06 upcoming/history + F-07 cancel |

Auth: `UserMenu` + `SessionProfileProvider`; mode dev: `DevAuthBanner` (`DEV_USER_ID` / header).

Layout bersama: `PageHeader`, `LoadingBlock` (`components/ui/`).

Kit UI (`components/ui`, import dari `./ui`) — wrapper tipis di atas class global, jadi class lama tetap sah:

| Komponen | Class | Catatan |
|----------|-------|---------|
| `Button` | `.btn` + `btn-{primary,secondary,ghost,danger,danger-outline}`, `.btn-sm`, `.btn-link` | `loading` → disabled + `aria-busy`; `buttonClass()` untuk `<Link>` |
| `Input` / `Select` / `Textarea` | `.input`, `.input-sm`, `.input-narrow` | `invalid` → `aria-invalid` + border danger |
| `Field` | `.field` | `<label>` pembungkus; `required` → `*` (aria-hidden); `hint` |
| `Card` | `.card`, `.card-lg` | `title` / `actions` opsional; `as` section/article/li |
| `Alert` | `.alert-{error,success,warning,info}` | `error` → `role="alert"`, lainnya `role="status"` |

Adopsi pertama: `BookingModal`. Layar lain dimigrasi bertahap di UI-04–UI-08.

### 5.2 Admin (role `admin`)

| Route | Fitur | Status |
|-------|-------|--------|
| `/admin/rooms` | F-08 CRUD / aktif-nonaktif | ✅ |
| `/admin/bookings` | F-09 semua booking + cancel alasan | ✅ |
| `/admin/audit` | F-11 audit log + filter tanggal | ✅ |

PRD F-03 detail ruang terpenuhi sebagian via kartu di `/rooms` dan room picker (halaman detail dedicated belum).

---

## 6. Layar Utama — `/book`

### 6.1 Room picker (5 ruang)

Komponen: `RoomPicker` — grid kartu selectable:

- Opsi **Semua ruang** — timeline menampilkan semua baris ruang.
- Satu kartu per ruang aktif: nama, lantai, kapasitas, amenities.
- Master data demo: `src/data/seed-rooms.ts` (**MR-A … MR-E**, 5 ruang) — selaras seed DB.

| Kode | Nama demo |
|------|-----------|
| MR-A | Ruang Executive A |
| MR-B | Ruang Focus B |
| MR-C | Ruang Townhall C |
| MR-D | Ruang Creative D |
| MR-E | Ruang Boardroom E |

### 6.2 Toolbar kalender

- Pemilih **tanggal** (input date).
- Toggle **Hari** (timeline) vs **Minggu** (grid jam × 7 hari, satu ruang) vs **Daftar**.
- Navigasi minggu: minggu lalu / minggu ini / minggu depan.
- Jam operasi: 07:00–21:00 WIB (`OPERATING_HOURS` di client).

### 6.3 Timeline (F-04)

- Tabel: baris = ruang (filter dari picker), kolom = jam.
- Sel kosong: klik → buka modal booking dengan jam prapilih.
- Sel terisi: tampilkan **judul** + **organizer** (D-2), tidak dapat di-overbook.

### 6.4 Modal booking (F-05)

Komponen: `BookingModal`

- Dropdown **Ruangan** jika >1 ruang (ganti ruang tanpa tutup modal).
- Field: judul (wajib), deskripsi, start/end jam.
- Error bentrok: pesan PRD §6 — *"Ruangan sudah dipesan pada waktu ini"* (+ detail API jika ada).
- Submit menunggu API (no optimistic UI).

---

## 7. Layar Lain

### 7.1 `/rooms`

`RoomDirectory` — daftar ruang aktif dari API; filter kapasitas/lantai sesuai query API.

### 7.2 `/bookings`

`MyBookingsList` — booking user; tombol **Batalkan** hanya jika organizer + memenuhi window **≥ 1 jam** sebelum start (D-1); pesan jelas jika ditolak.

### 7.3 `/login`

Entry OIDC (`AUTH_MODE=oidc`); redirect ke IdP per TDD §6.

---

## 8. Konten & Microcopy

| Konteks | Copy (ID) |
|---------|-----------|
| Konflik booking | Ruangan sudah dipesan pada waktu ini. |
| Cancel ditolak | Pembatalan hanya oleh organizer, minimal 1 jam sebelum meeting. |
| Empty bookings | Belum ada booking — mulai dari menu Booking. |
| Email | Bilingual ID+EN di worker (D-3) — bukan bagian UI. |

---

## 9. Responsif

- Breakpoint utama: **640px** — padding main dikurangi; nav wrap di header.
- Room picker: `grid` `auto-fill` min **160px** — 1–3 kolom di mobile, 5+ kartu di desktop.

---

## 10. Traceability (Design → PRD)

| Elemen UI | PRD / BRD |
|-----------|-----------|
| Room picker + 5 ruang | F-02, F-04, FR-06 |
| Organizer di slot | D-2, BR-06, F-04 |
| Modal + validasi | F-05, BR-01–04 |
| Cancel rules | D-1, F-07, BR-03 |
| Bahasa ID + WIB | PRD §6, BRD NFR localization |
| Brand logo + header modern | PRD §6, `BrandLogo` / `icon.svg` |

---

## 11. Status Implementasi vs Backlog

| Area | Status |
|------|--------|
| App shell (logo, sticky header, nav pill, mobile scroll, UserMenu) | ✅ UI-03 |
| `/book`, `/rooms`, `/bookings` | ✅ Implemented |
| Room picker 5 ruang + filter timeline | ✅ UI-04 (kode MR-A…E, listbox keyboard) |
| OIDC + dev auth | ✅ Implemented (staging UAT belum) |
| Admin UI F-08–F-09, audit F-11 | ✅ |
| Kalender week view (F-04) | ✅ Minggu — 7 kolom hari, per ruang |
| Playwright E2E | ⏳ Backlog |
| Foto ruang (OQ-3) | ⏳ Optional |

---

## 12. Dokumen Terkait

| Dokumen | Path |
|---------|------|
| BRD | [./BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) |
| PRD | [./PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) |
| TDD (stack & API) | [./TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) |
| Architecture | [./Architecture-Aplikasi-Booking-Ruang-Meeting.md](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| Kode UI | [../Apps/web/src/components/](../Apps/web/src/components/) |
| Agentic (regenerate ringkasan setup) | [../Agentic/README.md](../Agentic/README.md) |

---

*Akhir dokumen Design v1.1.*
