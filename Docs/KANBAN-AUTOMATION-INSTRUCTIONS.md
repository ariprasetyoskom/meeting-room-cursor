# Instruksi agent — Cursor Automation (KAD)



Salin blok di bawah ke field **instruksi / prompt** Automation webhook. **Satu Automation** melayani Development dan Test; beda per run lewat field `pipelineStage` dan `prompt` di body JSON.



```text

Terima body POST JSON dari papan admin meeting-room-cursor (KAD v1).



1. Parse JSON dan baca field "prompt" — itu instruksi utama untuk run ini (lebih spesifik dari poin generik di bawah).

2. Kerjakan issue pada repository di field "repository". Branch kerja: agent/issue-<issueNumber> (buat atau lanjutkan).

3. Satu webhook = satu run = satu pipelineStage. Ikuti stage run ini saja; jangan selesaikan Development dan Test sekaligus dalam satu run.



4. pipelineStage "development" (fase implementasi):

   - Implementasi scope issue; jalankan test lokal relevan; buka atau perbarui PR; jangan merge ke main/master.

   - Sebelum run selesai: perbarui body PR dengan ## Summary (perubahan, file penting, cara smoke test) agar kanban menampilkan ringkasan.

   - Jangan menjalankan verifikasi Test penuh di run ini. Setelah PR terdeteksi, papan otomatis pindah ke kolom Test dan server mengirim webhook kedua (pipelineStage "test").



5. pipelineStage "test" (fase verifikasi otomatis):

   - Checkout PR/branch agent yang sudah ada; jangan buka PR baru jika sudah ada.

   - Jalankan test/CI (mis. npm test di Apps/web); perbaiki minimal agar lulus; tulis bukti (perintah + exit code) di PR (## Test evidence atau komentar).

   - Perbarui ringkasan di body PR bila perlu agar kanban menampilkan hasil test.



6. Kanban & dispatch otomatis (bukan tugas agent):

   - Agent tidak menggeser kartu kanban.

   - Development selesai → kartu ke Test → run Test terpisah via webhook (kecuali operator menonaktifkan auto-chain di server).



7. Jika blocker: komentar di PR atau issue; hentikan dengan penjelasan jelas. Jangan merge.



Field correlationId, fromStage, dan source hanya untuk log.

```



## Perubahan vs versi lama



| Dulu | Sekarang |

|------|----------|

| Development selesai menunggu operator geser kanban ke Test | Papan + server auto-advance & auto-dispatch Test (env `BOARD_AUTO_DISPATCH_TEST`, default on) |

| Satu instruksi hanya Development | Branching eksplisit `development` vs `test` |



Webhook payload: [KANBAN-AGENT-DISPATCH-RUNBOOK.md](./KANBAN-AGENT-DISPATCH-RUNBOOK.md).

Template issue & body PR (briefing session baru): [PRD ORCH §4.6](./PRD-Orkestrasi-Manusia-AI.md).


