# Design Document — UI/UX & Visual
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | Design-Aplikasi-Booking-Ruang-Meeting |
| **Versi** | **1.0** |
| **Tanggal** | 29 September 2026 |
| **Status** | Baseline selaras implementasi `Apps/web` |
| **Dokumen Terkait** | [BRD](./BRD-Aplikasi-Booking-Ruang-Meeting.md) · [PRD](./PRD-Aplikasi-Booking-Ruang-Meeting.md) · [TDD](./TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) |

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
| Ikon | Tidak wajib MVP; teks + warna slot (hijau/merah) untuk status |

Detail stack lengkap: [TDD §2](./TDD-Aplikasi-Booking-Ruang-Meeting.md).

---

## 4. Design Tokens (Visual)

Definisi di `Apps/web/src/app/globals.css`:

| Token | Light (contoh) | Penggunaan |
|-------|----------------|------------|
| `--bg` | `#f4f6f9` | Latar aplikasi |
| `--surface` | `#ffffff` | Header, kartu, modal |
| `--text` / `--muted` | `#0f172a` / `#64748b` | Body / hint |
| `--primary` | `#2563eb` | Link aktif, seleksi ruang, CTA |
| `--danger` / `--success` | Merah / hijau | Error, konfirmasi |
| `--slot-free` / `--slot-busy` | Hijau muda / merah muda | Sel timeline kosong/terisi |
| `--radius` | `10px` | Kartu, input, modal |
| `--shadow` | Subtle | Header elevation |

---

## 5. Layout & Navigasi

### 5.1 App shell

Komponen: `AppShell` — header sticky, brand **Ruang Meeting**, nav utama:

| Route | Label nav | Fungsi (PRD) |
|-------|-----------|--------------|
| `/book` | Booking | F-04 kalender + F-05 buat booking |
| `/rooms` | Ruang | F-02 daftar ruang |
| `/bookings` | Booking saya | F-06 upcoming/history + F-07 cancel |

Auth: `UserMenu`; mode dev menampilkan `DevAuthBanner` (header `x-dev-user-id`).

### 5.2 Halaman yang direncanakan (belum UI)

| Route | Fitur | Status |
|-------|-------|--------|
| `/admin/rooms` | F-08 | ✅ |
| `/admin/bookings` | F-09 | ✅ |
| `/admin/audit` | F-11 | ✅ |

PRD F-03 detail ruang terpenuhi sebagian via kartu di `/rooms` dan room picker.

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
- Toggle **Timeline** vs **Daftar** (list view ringkas per ruang).
- Jam operasi: 08:00–18:00 WIB (konstanta client).

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

---

## 11. Status Implementasi vs Backlog

| Area | Status |
|------|--------|
| App shell, `/book`, `/rooms`, `/bookings` | ✅ Implemented |
| Room picker 5 ruang + filter timeline | ✅ Implemented |
| OIDC + dev auth | ✅ Implemented |
| Admin UI F-08–F-09, audit F-11 | ✅ |
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

---

*Akhir dokumen Design.*
