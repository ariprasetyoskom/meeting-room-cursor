---
name: devops-agent
description: >-
  Pelaksana stage ORCH untuk kanonik infra, ci, ops, dan worker. Membaca acuan,
  menulis dokumen agent (rencana dan verdict) terpisah dari dokumen development
  (hasil dan bukti), dan mengubah hanya path DevOps. Gunakan saat user menyebut
  devops, Docker, compose, CI, GitHub Actions, staging, secrets, health probe,
  worker email, atau task fase kanonik infra/ci/ops/worker.
---

# Agent DevOps

Pelaksana satu stage (`develop`, `test`, atau `audit`) pada task kanonik **infra**, **ci**, **ops**, atau **worker**. Skill ini tidak membuka stage berikutnya.

Dua berkas, jangan digabung:

| Berkas | Path | Isi |
|--------|------|-----|
| Dokumen agent | `Agentic/runs/{taskId}/agent/{attempt}-{stage}.md` | Acuan, Yang akan dilakukan, Di luar scope, Verdict |
| Dokumen development | `Agentic/runs/{taskId}/development/{attempt}-{stage}.md` | Tautan ke dokumen agent, Yang dihasilkan, Bukti |

## Kapan dipakai

- Task ID berpola `{xxxx}{yy}-{kanonik}-task` dengan kanonik di atas (contoh `PSET02-infra-task`).
- Permintaan operasi pada `Devops/`, `.github/workflows/`, compose, atau pipeline.

Kanonik lain (stack, be, fe, auth): berhenti dan sebut skill ini tidak berlaku.

## Acuan wajib

Baca sebelum mengisi **Yang akan dilakukan**. Jangan menambah acuan di luar daftar tanpa verdict `clarify`.

| Stage | Acuan |
|-------|--------|
| **develop** | PRD induk pada kolom Ref PRD; baris task di dokumen fase; pasangan dokumen develop attempt sebelumnya bila attempt > 1 |
| **test** | Dokumen agent dan dokumen development develop attempt terakhir; kolom Output / verifikasi; diff branch `agent/{taskId}` |
| **audit** | Ref PRD task; pasangan dokumen develop; pasangan dokumen test; diff dan log di dokumen development test |

Audit tidak membaca transkrip develop. Pelaksana audit tidak boleh sama dengan pelaksana develop task itu.

Acuan repo, hanya bagian yang disebut task:

- [Docs/PRD-Orkestrasi-Manusia-AI.md](../../Docs/PRD-Orkestrasi-Manusia-AI.md) §4.4
- [Devops/README.md](../../Devops/README.md)
- [Devops/docker/docker-compose.yml](../../Devops/docker/docker-compose.yml) untuk **infra**
- [Devops/ci/README.md](../../Devops/ci/README.md) dan `.github/workflows/ci.yml` untuk **ci**
- [Docs/000_platform_setup/techstack.md](../../Docs/000_platform_setup/techstack.md) untuk port dan script

`Docs/` adalah acuan produk. Jangan menulis run ke `Docs/`.

## Workflow

1. Catat `taskId`, `stage`, `attempt` (default attempt `1`), dan kanonik.
2. Baca acuan stage itu. Catat path dan bagian yang benar-benar dibaca.
3. Salin [template-agent.md.tmpl](./template-agent.md.tmpl) ke path dokumen agent. Isi **Acuan**, **Yang akan dilakukan**, dan **Di luar scope**.
4. Jika langkah menyentuh larangan di bawah, isi **Verdict** `clarify` dengan satu pertanyaan. Jangan membuat dokumen development.
5. Kerjakan hanya langkah yang sudah tertulis di dokumen agent.
6. Salin [template-development.md.tmpl](./template-development.md.tmpl). Isi **Tautan**, **Yang dihasilkan**, dan **Bukti**. Jangan menulis verdict di berkas ini.
7. Isi **Verdict** di dokumen agent (`pass`, `fail`, atau `clarify`).
8. Serahkan kedua path. Jangan membuka stage lain, jangan merge, jangan menandai task `done`.

Pada kanonik **ci**, **ops**, dan **worker**, verdict audit `pass` tetap menunggu manusia menutup task. Tulis itu di **Di luar scope** dokumen agent. Kanonik **infra** boleh lanjut otomatis hanya lewat orchestrator, setelah perintah verifikasi exit 0.

## Path yang boleh diubah

- `Agentic/runs/{taskId}/agent/`, `Agentic/runs/{taskId}/development/`
- `Devops/docker/`, `Devops/ci/`, `Devops/infra/`
- `.github/workflows/`
- `Apps/web/.env.example` (nama variabel saja, tanpa nilai rahasia)

## Larangan

- Jangan menggabung rencana dan bukti dalam satu berkas.
- Jangan menulis isi `.env`, `.env.local`, token, atau `AUTH_SECRET` ke kedua dokumen maupun git.
- Jangan mengubah port **3000**, **5434**, atau **6379** tanpa `clarify`. Postgres dev tetap `5434:5432`, user `booking`, database `booking_meeting`.
- Jangan `docker compose down -v`, menghapus volume, atau force-push.
- Jangan deploy production atau mengisi secret sungguhan. Sebut lokasi (GitHub Environment `staging` / `production`) tanpa nilainya.
- Verdict `pass` hanya jika perintah verifikasi task exit 0 dan buktinya ada di dokumen development.

## Perintah verifikasi

Jalankan dari workspace. Jangan mengganti perintah yang sudah tertulis di kolom Output / verifikasi task.

| Kanonik | Perintah baku bila task tidak menyebut perintah lain |
|---------|------------------------------------------------------|
| **infra** | `docker version`; di `Devops/docker`: `docker compose ps` (postgres dan redis healthy) |
| **ci** | di `Apps/web`: `npm run lint`, `npm test`, `npm run build` |
| **worker** | `docker compose ps` redis healthy; script `worker:email` ada di `Apps/web/package.json` |
| **ops** | Tidak ada perintah yang menutup task sendiri. Dokumen development menyebut probe `/api/health` dan environment secrets; verdict audit di dokumen agent menunggu manusia |

## Template

- [template-agent.md.tmpl](./template-agent.md.tmpl)
- [template-development.md.tmpl](./template-development.md.tmpl)
