# Instruksi agent — Cursor Automation (KAD)

Salin blok di bawah ke field **instruksi / prompt** Automation webhook. **Satu Automation** melayani Development, Test, dan Audit; beda per run lewat field `pipelineStage` dan `prompt` di body JSON.

```text
Terima body POST JSON dari papan admin meeting-room-cursor (KAD v1).

1. Parse JSON dan baca field "prompt" — itu instruksi utama untuk run ini (lebih spesifik dari poin generik di bawah).
2. Kerjakan issue pada repository di field "repository". Branch kerja: agent/issue-<issueNumber> (buat atau lanjutkan).
3. Satu webhook = satu run = satu pipelineStage. Ikuti stage run ini saja; jangan gabung Development, Test, dan Audit dalam satu run.

4. pipelineStage "development" (fase implementasi):
   - Implementasi scope issue; jalankan test lokal relevan; buka atau perbarui PR; jangan merge ke main/master.
   - Sebelum run selesai: perbarui body PR dengan ## Summary (perubahan, file penting, cara smoke test) agar kanban menampilkan ringkasan.
   - Jangan menjalankan verifikasi Test penuh di run ini. Setelah PR terdeteksi, papan otomatis pindah ke Test dan server mengirim webhook kedua (pipelineStage "test").

5. pipelineStage "test" (fase verifikasi otomatis):
   - Checkout PR/branch agent yang sudah ada; jangan buka PR baru jika sudah ada.
   - Jalankan test/CI (mis. npm test di Apps/web); perbaiki minimal agar lulus; tulis bukti (perintah + exit code) di PR (## Test evidence atau komentar).
   - Perbarui ringkasan di body PR bila perlu agar kanban menampilkan hasil test.
   - Jangan menjalankan Audit penuh di run ini. Setelah verifikasi lulus, papan otomatis lanjut ke Audit dan server mengirim webhook ketiga (pipelineStage "audit").

6. pipelineStage "audit" (fase review ORCH — pelaksana audit ≠ develop):
   - Checkout PR/branch agent yang sama; baca ## Summary, ## Test evidence, diff PR, dan acceptance issue.
   - Review kontrak & scope; jangan menulis ulang fitur kecuali perbaikan bug kecil yang wajib agar audit jujur.
   - Sebelum run selesai: tambahkan ## Audit di body PR dengan **Verdict:** pass | fail | clarify (wajib). Server **tidak** lanjut ke Human QA/Clarify tanpa verdict valid di PR (gate ketat; log `dispatch.stage_check` di `Development/logs/kad-dispatch.jsonl`).
   - Opsional: pasangan dokumen agent + development stage audit di Agentic/runs/ bila skill devops-agent dipakai.

7. Kanban & dispatch otomatis (bukan tugas agent):
   - Agent tidak menggeser kartu kanban.
   - Development selesai → Test → Audit (rantai webhook). Setelah Audit: Verdict pass → Human QA; clarify → Human Clarify; fail → tetap Audit. Matikan rantai: BOARD_AUTO_DISPATCH_TEST / BOARD_AUTO_DISPATCH_AUDIT.

8. Jika blocker: komentar di PR atau issue; hentikan dengan penjelasan jelas. Jangan merge.

Field correlationId, fromStage, dan source hanya untuk log.
```

## Env server (rantai otomatis)

| Env | Default | Efek |
|-----|---------|------|
| `BOARD_AUTO_DISPATCH_TEST` | aktif | Setelah Development selesai → webhook Test |
| `BOARD_AUTO_DISPATCH_AUDIT` | aktif | Setelah Test selesai → webhook Audit |

Webhook payload: [KANBAN-AGENT-DISPATCH-RUNBOOK.md](./KANBAN-AGENT-DISPATCH-RUNBOOK.md).

Template issue & body PR: [PRD ORCH §4.6](./PRD-Orkestrasi-Manusia-AI.md) (tambahkan **## Audit** di template PR saat stage Audit).
