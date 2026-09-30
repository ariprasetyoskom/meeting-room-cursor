# GitHub Project — meeting-room-cursor

| | |
|--|--|
| **Board** | [Project #1 — meeting-room-cursor](https://github.com/users/ariprasetyoskom/projects/1) |
| **Repo** | [ariprasetyoskom/meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor) |

Kanban ini selaras dengan dokumen delivery di repo. Spesifikasi scheduler: [PRD-GitHub-Project-Scheduler.md](./PRD-GitHub-Project-Scheduler.md).

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
- Setelah workflow di bawah aktif, menutup issue di GitHub otomatis memindahkan kartu ke **Done**.

## Workflow Project (aktifkan sekali di GitHub UI)

Buka [Project #1](https://github.com/users/ariprasetyoskom/projects/1) → **⋯** (kanan atas) → **Workflows**.

| Workflow | Setelan | Tujuan |
|----------|---------|--------|
| **Item closed** | When: *Item is closed* → Set **Status** to **Done** | UI-01–03 / Wave 1 selesai tanpa drag manual |
| **Item reopened** (opsional) | When: *Item is reopened* → Set **Status** to **Todo** | Issue dibuka lagi tidak stuck di Done |
| **Auto-add to project** (opsional) | When: *Issue opened* on repo `meeting-room-cursor` → **Add to project** | Issue baru langsung masuk board |

**Catatan:** Workflow Project **tidak** bisa di-commit ke repo; konfigurasi disimpan di GitHub. Dokumen ini adalah runbook tim.

### View tambahan (disarankan)

1. **+ New view** → **Table**.  
2. **Group by:** `Track` atau `Milestone`.  
3. **Filter:** `Status` is not `Done` untuk fokus sprint aktif.

## Setup board (sudah / lanjutkan di UI)

1. Repo **linked** ke project.  
2. Field custom **Track** (3 opsi di atas).  
3. Aktifkan workflow **Item closed → Done** (lihat atas).  
4. **#30** epic → **In Progress** (manual); **#31–#33** → **Done** setelah issue closed (workflow atau script).  
5. View **Table** + group by **Track**.

## Script sync (hindari rate limit)

Jangan loop `item-edit` untuk puluhan issue sekaligus. Gunakan script yang hanya mengubah kartu **yang tidak selaras**:

```bash
# Preview
node Devops/scripts/sync-project-status.mjs --dry-run

# Closed issue → Done (jeda 600ms antar edit)
node Devops/scripts/sync-project-status.mjs

# Issue dibuka lagi + kartu masih Done → Todo
node Devops/scripts/sync-project-status.mjs --fix-reopened
```

Env opsional: `PROJECT_OWNER` (default `@me`), `PROJECT_NUMBER` (`1`), `PROJECT_SYNC_DELAY_MS` (default `600`).

Prasyarat: `gh auth login` dengan scope **`project`**.

## Scheduler — cek In Progress setiap 15 menit

GitHub **tidak** punya cron bawaan untuk Project; gunakan salah satu:

### A) GitHub Actions (disarankan, jalan tanpa laptop)

Entry point: `node Devops/scripts/run-project-scheduler.mjs` (lihat [PRD scheduler](./PRD-GitHub-Project-Scheduler.md)).

**UI admin:** `/admin/scheduler` — toggle ON/OFF (`PROJECT_SCHEDULER_ENABLED`) + auto-sync; butuh `GH_SCHEDULER_ADMIN_TOKEN` di server.

Workflow: [`.github/workflows/project-board-check.yml`](../.github/workflows/project-board-check.yml)

1. Buat **classic PAT** → scope **`project`** (read cukup untuk laporan; write jika sync).  
2. Repo → **Settings → Secrets → Actions** → `GH_PROJECT_PAT`.  
3. Workflow jalan tiap **15 menit** (`cron: */15 * * * *` UTC); hasil di **Summary** run Actions.  
4. Opsional: repo **Variable** `PROJECT_SYNC_ON_SCHEDULE` = `true` agar sekalian jalankan `sync-project-status.mjs`.

Manual trigger: **Actions → Project board check → Run workflow**.

### B) Windows Task Scheduler (lokal)

```powershell
$repo = "D:\Cursor"
$action = New-ScheduledTaskAction -Execute "node.exe" `
  -Argument "Devops\scripts\report-project-in-progress.mjs" `
  -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Minutes 15) `
  -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "MeetingRoom-ProjectInProgress" `
  -Action $action -Trigger $trigger -Description "GitHub Project In Progress"
```

Prasyarat: `gh auth login` sudah jalan untuk user yang menjalankan task.

### C) Cursor `/loop 15m` (hanya saat chat/IDE aktif)

Bukan scheduler server — cocok untuk sesi dev singkat, bukan monitoring 24/7.

### Script laporan

```bash
node Devops/scripts/run-project-scheduler.mjs
node Devops/scripts/run-project-scheduler.mjs --json
node Devops/scripts/run-project-scheduler.mjs --sync
.\Devops\scripts\run-project-scheduler.ps1 -Sync
```

---

*Diperbarui 30 Sep 2026 — workflow + script sync-project-status.*
