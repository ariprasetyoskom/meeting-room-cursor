# Runbook — Kanban Agent Dispatch (KAD)

Selaras [PRD-Kanban-Agent-Dispatch.md](./PRD-Kanban-Agent-Dispatch.md) v1.0.

## 1. Cursor Automation (sekali)

1. Di Cursor: buat **Automation baru** dengan pemicu **Incoming HTTP webhook**.
2. Repo: `ariprasetyoskom/meeting-room-cursor`, branch kerja (mis. `cursor/meeting-room-web-scaffold`).
3. Instruksi agent (ringkas): jalankan `prompt` dari body webhook; kerjakan issue; buka PR; jangan merge.
4. Setelah disimpan, salin **URL webhook** dan **secret** ke server (bukan ke browser).

## 2. Env server (`Apps/web/.env.local`)

```env
BOARD_AGENT_DISPATCH_ENABLED=true
CURSOR_AUTOMATION_WEBHOOK_URL=<dari Automation>
CURSOR_AUTOMATION_WEBHOOK_SECRET=<dari Automation>
GH_DISPATCH_PAT=<PAT scope repo, baca issues>
# Opsional — default owner/name dari GITHUB_REPO_*
GITHUB_DISPATCH_REPO=ariprasetyoskom/meeting-room-cursor
BOARD_DISPATCH_LOCK_TTL_MS=14400000
```

Restart `npm run dev:admin` setelah mengubah env.

## 3. Uji manual

1. Buka http://localhost:3001/admin/board (sesi admin).
2. Geser issue **#35** dari Todo → **In Progress**.
3. Harapan: toast sukses “Agent dipanggil #35”; banner menampilkan `correlationId`.
4. Geser **#36** saat #35 masih aktif → kartu kembali; pesan lock.
5. Epic **#30** → ditolak (geser sub-issue saja).

## 4. Matikan dispatch

`BOARD_AGENT_DISPATCH_ENABLED=false` — geser kartu hanya mengubah UI lokal.

## 5. Lepas lock (dev)

```http
DELETE /api/v1/admin/board/dispatch
```

(dengan header dev admin / session admin)

Ledger: `Apps/web/.data/board-dispatch.json` (gitignored).
