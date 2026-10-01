# KAD — commit lokal dulu, PR setelah Human QA

## Ringkas

| Fase | Agent / operator | Git / GitHub |
|------|------------------|--------------|
| Development → Audit | Commit + push ke `agent/issue-<n>` | Gate baca **body issue** (`## Summary`, `## Test evidence`, `## Audit`) |
| Human QA | Uji lokal (checkout branch agent) | Belum wajib PR |
| Setelah QA lulus | Buka **PR** ke `main` / branch integrasi | Merge manual |

Aktifkan di server:

```env
BOARD_KAD_DEFER_PR_UNTIL_HUMAN_QA=true
```

Default **false** (gate tetap memakai body PR seperti sebelumnya).

## Operator

1. Geser kanban → agent bekerja di branch agent.
2. Pantau `Development/logs/kad-dispatch.jsonl` (`dispatch.stage_check`).
3. Di **Human QA**: `git fetch && git checkout agent/issue-<n>`, smoke test.
4. **Setelah lulus QA**: buat PR (gh / GitHub UI), lalu geser kartu ke **Done** / merge.

## Automation

Instruksi agent: [KANBAN-AUTOMATION-INSTRUCTIONS.md](./KANBAN-AUTOMATION-INSTRUCTIONS.md).

Log reminder: `dispatch.human_qa_open_pr_reminder` setelah Audit pass tanpa PR.
