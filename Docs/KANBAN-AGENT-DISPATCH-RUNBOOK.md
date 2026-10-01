# Runbook — Kanban Agent Dispatch (KAD)

Selaras [PRD-Kanban-Agent-Dispatch.md](./PRD-Kanban-Agent-Dispatch.md) v1.0.

## 1. Cursor Automation (sekali)

1. Di Cursor: buat **Automation baru** dengan pemicu **Incoming HTTP webhook**.
2. Repo: `ariprasetyoskom/meeting-room-cursor`, branch kerja (mis. `cursor/meeting-room-web-scaffold`).
3. Instruksi agent: salin dari [KANBAN-AUTOMATION-INSTRUCTIONS.md](./KANBAN-AUTOMATION-INSTRUCTIONS.md) (satu Automation; `development`, `test`, `audit`).

4. Setelah disimpan, salin **URL webhook** dan **secret** ke server (bukan ke browser).

### Body webhook (contoh)

Server mengirim:

```json
{
  "source": "kad-v1",
  "correlationId": "uuid",
  "issueNumber": 35,
  "repository": "ariprasetyoskom/meeting-room-cursor",
  "pipelineStage": "development",
  "fromStage": "intake",
  "prompt": "… teks lengkap untuk agent …"
}
```

Automation cukup memakai `prompt`; field lain untuk log/observability.

Rantai otomatis (default aktif): Development selesai → webhook `"pipelineStage": "test"`; Test selesai → webhook `"audit"`. Matikan per stage: `BOARD_AUTO_DISPATCH_TEST`, `BOARD_AUTO_DISPATCH_AUDIT`. Papan menyelaraskan kolom kartu dengan ledger KAD (Test → Audit → Human QA).

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
2. Geser issue **#35** dari **Intake** (atau **Plan**) → **Development**.
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

Log & ledger terpusat: `Development/logs/` — `kad-dispatch.jsonl` (event), `kad-dispatch-ledger.json` (lock). Legacy `Apps/web/.data/` dimigrasi otomatis saat baca.

Event gate (default `BOARD_KAD_STRICT_GATES` aktif): `dispatch.stage_check` (`ok: false` + `reasons[]` = stage belum selesai, **tidak** auto-chain); `dispatch.completed` = stage lulus; `dispatch.auto_chain_attempt` sebelum webhook berikutnya.

Mode commit dulu: `BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA=true` — lihat [KANBAN-LOCAL-DELIVERY.md](./KANBAN-LOCAL-DELIVERY.md); log `dispatch.human_qa_open_pr_reminder` setelah Audit pass tanpa PR.
