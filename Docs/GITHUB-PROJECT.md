# GitHub Project — meeting-room-cursor

| | |
|--|--|
| **Board** | [Project #1 — meeting-room-cursor](https://github.com/users/ariprasetyoskom/projects/1) |
| **Repo** | [ariprasetyoskom/meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor) |

Kanban ini selaras dengan dokumen delivery di repo.

## Kolom Status (Kanban)

| Kolom | Arti |
|-------|------|
| **Todo** | Belum dikerjakan |
| **In Progress** | Sedang aktif |
| **Done** | Selesai (selaraskan dengan issue **Closed** bila sudah merge) |

## Field **Track**

| Nilai | Issue | Milestone GitHub | Dokumen |
|-------|-------|------------------|---------|
| **Wave 1 — F-10 (S4)** | #1–#29 `[W1-*]` | S4 Wave 1 - Email (F-10) | [PLAN-Wave-1-Email.md](./PLAN-Wave-1-Email.md) |
| **UI Enhance — MVP polish** | #31–#40 `[UI-*]` | UI Enhance - MVP polish | [PLAN-UI-Enhance.md](./PLAN-UI-Enhance.md) |
| **Epic / meta** | #30 UI-EPIC | UI Enhance - MVP polish | Epic #30 |

## Label → filter board

- Wave 1: `wave1`, `wave1-redis`, `wave1-smtp`, `wave1-template`, `wave1-queue`, `wave1-reminder`, `wave1-ops`, `wave1-qa`
- UI: `ui-enhance`, `ui-foundation`, `ui-shell`, `ui-book`, `ui-secondary`, `ui-admin`, `ui-qa`

## Urutan kerja (referensi)

1. **Must rilis:** Wave 1 (#1–#29) — PRD F-10, D-3  
2. **Paralel (non-blok):** UI #31→#40 — PRD §6, Design §4–§7  
3. **Snapshot produk:** [PRD §4.1–§4.3](./PRD-Aplikasi-Booking-Ruang-Meeting.md)

## Tips monitor

- **Board:** drag issue antar kolom Status.  
- **Table view (tambah di UI):** group by **Milestone** atau **Track**.  
- Saat menutup issue di GitHub, pindahkan kartu ke **Done** (atau aktifkan workflow Project: *When issue closed → Status Done*).

## Setup board (sudah / lanjutkan di UI)

1. Repo **linked** ke project.  
2. Field custom **Track** (3 opsi di atas).  
3. Issue **#31–#32** ditambahkan ke board → set **Done**.  
4. **#30** epic → **In Progress**; **#31–#33** (UI-01–03) → **Done** (issue GitHub **Closed**).  
5. (Disarankan) Duplikasi view → **Table**, group by **Track** atau **Milestone**.  
6. (Disarankan) Workflow: *Issue closed* → *Status = Done*.

Jika API rate limit, ulangi langkah 3–4 manual atau jalankan:

`gh project item-edit 1 --owner ariprasetyoskom --url https://github.com/ariprasetyoskom/meeting-room-cursor/issues/31 --field Status --value Done`

---

*Diperbarui 30 Sep 2026 — selarasan issue #1–#40.*
