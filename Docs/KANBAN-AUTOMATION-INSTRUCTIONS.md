# Instruksi agent — Cursor Automation (KAD)

Salin blok di bawah ke field **instruksi / prompt** Automation webhook. **Satu Automation** melayani Development, Test, dan Audit; beda per run lewat field `pipelineStage` dan `prompt` di body JSON.

```text
Terima body POST JSON dari papan admin meeting-room-cursor (KAD v1).

1. Parse JSON dan baca field "prompt" — itu instruksi utama untuk run ini (lebih spesifik dari poin generik di bawah).
2. Kerjakan issue pada repository di field "repository". Branch kerja: agent/issue-<issueNumber> (buat atau lanjutkan).
3. Satu webhook = satu run = satu pipelineStage. Selesaikan stage ini sampai gate server lulus; jangan gabung Development, Test, dan Audit dalam satu run.

4. pipelineStage "development" (implementasi):
   - Implementasi scope issue; jalankan test lokal relevan; buka atau perbarui PR; jangan merge ke main/master.
   - Wajib sebelum run selesai: (a) push commit ke branch agent, (b) perbarui body PR dengan ## Summary (isi nyata ≥ beberapa baris: perubahan, file utama, cara smoke test).
   - Server tidak menandai Development selesai hanya karena PR ada — butuh Summary + commit setelah dispatch. Baru then auto-chain ke Test (jika BOARD_AUTO_DISPATCH_TEST aktif).
   - Jangan isi ## Test evidence / ## Audit penuh di run ini (cukup placeholder singkat jika perlu).

5. pipelineStage "test" (verifikasi):
   - Checkout PR/branch agent yang ada; jangan buka PR baru.
   - Jalankan `cd Apps/web && npm test` (perbaiki minimal jika gagal).
   - Wajib: edit body PR — ganti placeholder di ## Test evidence dengan bukti nyata: perintah + exit code 0 (tabel markdown atau blok ``` dengan baris `exit code 0`), ATAU pastikan CI GitHub hijau pada head PR.
   - Commit-only / file di Agentic/ tanpa update ## Test evidence di PR tidak meluluskan gate Test.
   - Setelah gate lulus, server auto-chain Audit (jika BOARD_AUTO_DISPATCH_AUDIT aktif).

6. pipelineStage "audit" (review ORCH — pelaksana ≠ develop):
   - Baca ## Summary, ## Test evidence, diff PR, acceptance issue.
   - Wajib: edit body PR — ## Audit dengan **Verdict:** pass | fail | clarify (bukan pending/placeholder).
     - pass → kanban Human QA · clarify → Human Clarify · fail → tetap Audit (perbaiki lalu audit ulang).
   - Verdict hanya di body PR (bukan cukup commit message terpisah) saat gate ketat aktif.
   - Opsional: dokumen ORCH di Agentic/runs/ — tidak mengganti ## Audit di PR.

7. Kanban & gate server (bukan tugas agent):
   - Agent tidak menggeser kartu kanban.
   - Run Automation "sukses" di Cursor ≠ stage KAD selesai. Papan mem-poll GitHub; lihat log `dispatch.stage_check` / `dispatch.completed` di Development/logs/kad-dispatch.jsonl.
   - Rantai Development → Test → Audit hanya setelah stage saat ini `dispatch.completed`.

8. Blocker: komentar di PR/issue; hentikan dengan penjelasan jelas. Jangan merge ke main/master.

Field correlationId, fromStage, dan source hanya untuk log.
```

## Env server

| Env | Default | Efek |
|-----|---------|------|
| `BOARD_AUTO_DISPATCH_TEST` | aktif | Setelah Development gate lulus → webhook Test |
| `BOARD_AUTO_DISPATCH_AUDIT` | aktif | Setelah Test gate lulus → webhook Audit |
| `BOARD_KAD_STRICT_GATES` | aktif | Gate PR body per stage (Summary / Test evidence / Audit verdict) |

Webhook payload: [KANBAN-AGENT-DISPATCH-RUNBOOK.md](./KANBAN-AGENT-DISPATCH-RUNBOOK.md).

Template issue & body PR: [PRD ORCH §4.6](./PRD-Orkestrasi-Manusia-AI.md).
