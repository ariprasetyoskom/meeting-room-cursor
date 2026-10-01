# Instruksi agent — Cursor Automation (KAD)

Salin blok di bawah ke field **instruksi / prompt** Automation webhook.

**Mode disarankan (local-first):** set `BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA=true` di server — commit di branch agent, bukti stage di **body issue**, **PR dibuka setelah Human QA lulus**. Detail: [KANBAN-LOCAL-DELIVERY.md](./KANBAN-LOCAL-DELIVERY.md).

```text
Terima body POST JSON dari papan admin meeting-room-cursor (KAD v1).

1. Parse JSON; field "prompt" adalah instruksi utama run ini.
2. Repository: field "repository". Branch: agent/issue-<issueNumber>.
3. Satu webhook = satu pipelineStage. Selesaikan gate stage ini sebelum run berakhir.

4. Pengiriman (jika server BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA=true):
   - Push commit ke branch agent; **jangan buka PR** sampai Human QA lulus.
   - Tulis ## Summary / ## Test evidence / ## Audit di **body issue GitHub** (bukan hanya commit/Agentic).
   - Setelah operator QA lulus: buka PR ke main (merge manual).

5. pipelineStage "development":
   - Implementasi scope; test lokal; push commit.
   - Perbarui body issue (atau PR jika mode PR awal) — ## Summary lengkap.
   - Gate: Summary + commit setelah dispatch → baru chain Test.

6. pipelineStage "test":
   - npm test di Apps/web; perbaiki jika gagal.
   - ## Test evidence dengan exit code 0 (bukan placeholder).
   - Gate lulus → chain Audit.

7. pipelineStage "audit":
   - Review diff branch vs acceptance.
   - ## Audit + **Verdict:** pass | fail | clarify di body issue/PR.
   - pass → Human QA; clarify → Human Clarify.

8. Kanban: agent tidak geser kartu. Run Cursor sukses ≠ KAD selesai — cek dispatch.stage_check / dispatch.completed di Development/logs/kad-dispatch.jsonl.

9. Blocker: komentar issue/PR. Jangan merge ke main/master tanpa QA.

Field correlationId, fromStage, source hanya untuk log.
```

## Env server

| Env | Default | Efek |
|-----|---------|------|
| `BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA` | false | true = gate baca issue, PR setelah Human QA |
| `BOARD_KAD_STRICT_GATES` | aktif | Summary / Test evidence / Audit wajib valid |
| `BOARD_AUTO_DISPATCH_TEST` | aktif | Chain Test setelah Development gate |
| `BOARD_AUTO_DISPATCH_AUDIT` | aktif | Chain Audit setelah Test gate |

Webhook: [KANBAN-AGENT-DISPATCH-RUNBOOK.md](./KANBAN-AGENT-DISPATCH-RUNBOOK.md).
