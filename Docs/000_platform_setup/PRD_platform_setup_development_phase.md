# Fase Development — Platform Environment Setup

| Metadata | |
|----------|---|
| **Dokumen** | PRD_platform_setup_development_phase |
| **Induk** | [PRD-Platform-Environment-Setup.md](./PRD-Platform-Environment-Setup.md) **v1.1** |
| **Identitas PRD (`xxxx`)** | **PSET** — *Platform Environment Setup* |
| **Versi** | **1.1** |
| **Tanggal** | 29 September 2026 |
| **Status** | Selaras PRD induk §4–9 |

---

## Konvensi task ID

```text
{xxxx}{yy}-{kanonik}-task
```

| Segmen | Arti |
|--------|------|
| `xxxx` | **PSET** — identitas PRD platform setup |
| `yy` | Urutan **01–99** **per kanonik** (reset tiap kanonik) |
| `{kanonik}` | Domain kerja (lihat tabel di bawah) |
| `-task` | Suffix tetap |

### Kanonik

| Kanonik | Cakupan | PRD induk (contoh) |
|---------|---------|-------------------|
| **stack** | Toolchain, repo, dependency, file env | PS-01, PS-03–05, F-PS-02, P-02 |
| **infra** | Docker, jaringan, port, volume | PS-02, F-PS-01, P-01 |
| **be** | Database, migrasi, seed, API platform | F-PS-03–07, P-04–P-05 |
| **fe** | Dev server, halaman UI, smoke design | F-PS-05, F-PS-08, P-06 |
| **auth** | Dev auth / OIDC / session | P-03, F-PS-S04 |
| **worker** | BullMQ, Redis consumer, email | F-PS-09 |
| **ci** | Lint, test, build, pipeline | F-PS-S06 |
| **ops** | Staging/prod, secrets, deploy, SMTP | F-PS-S01–S07 |

---

## Pemetaan cepat: Fase ↔ PRD induk

| Fase | Gate PRD | Fitur / ID |
|------|----------|------------|
| **0** | §1, §5 | P-01–P-06 |
| **1** | §4, F-PS-02 | PS-01, PS-03–05 |
| **2** | F-PS-01 | PS-02, P-01 |
| **3** | F-PS-03–07 | P-04, P-05 |
| **4** | F-PS-05, F-PS-08 | P-06 |
| **5** | P-03, F-PS-S04 | Auth dev + OIDC |
| **6** | F-PS-09 | Worker (opsional lokal) |
| **7** | F-PS-S06 | CI |
| **8** | F-PS-S01–S07 | Staging/prod |
| **9** | §9 | Sign-off lokal + handover |

---

## Fase 0 — Kickoff & scope

**Tujuan:** Tim sepakat lingkungan target (local dulu) dan keputusan **P-01–P-06** terkunci (PRD §5).

| Tahap | Ref PRD | Detail |
|-------|---------|--------|
| 0.1 | §1, §14 | Baca PRD setup, [arsitektur](./arsitektur.md), [techstack](./techstack.md), [design](./design.md) |
| 0.2 | §3 | Tentukan persona eksekutor (dev / DevOps) per fase |
| 0.3 | §4 | Catat baseline monorepo `Docs/`, `Apps/web`, `Devops/docker` |

**Gate keluar:** Keputusan **P-01–P-06** disetujui.

---

## Fase 1 — Stack & prasyarat lokal

**Tujuan:** Mesin developer siap menjalankan `Apps/web` (**PS-01, PS-03–PS-05**, **F-PS-02**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-stack-task** | PS-01 | Node LTS | Pasang Node.js **20 LTS**; `node -v` / `npm -v` | Versi major 20 |
| **PSET02-stack-task** | PS-03 | Clone repo | Clone workspace; struktur `Apps/web`, `Devops`, `Docs` | `git status` OK |
| **PSET03-stack-task** | PS-04 | Port bebas | Pastikan **3000**, **5434**, **6379** tidak bentrok | Tidak ada listener konflik |
| **PSET04-stack-task** | PS-05 | File env | Salin `Apps/web/.env.example` → `.env.local` | File gitignored ada |
| **PSET05-stack-task** | §6.1, P-01 | Env awal | `AUTH_MODE=dev`, `DATABASE_URL` …**5434**…, `REDIS_URL`, `NEXT_PUBLIC_APP_URL` | Selaras matriks env local |
| **PSET06-stack-task** | F-PS-02 | Dependencies | `cd Apps/web && npm install` | `node_modules` tanpa error |
| **PSET07-stack-task** | P-02 | Env OS | Cek `DATABASE_URL` global OS; selaraskan dengan `.env.local` | Tidak override port salah |

**Gate keluar:** **F-PS-02** lulus; `.env.local` valid.

---

## Fase 2 — Infra lokal (Docker)

**Tujuan:** Postgres 15 + Redis 7 healthy (**PS-02**, **F-PS-01**, **P-01**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-infra-task** | PS-02 | Engine Docker | Docker Desktop/Engine + Compose v2 | `docker version` OK |
| **PSET02-infra-task** | F-PS-01 | Compose up | `Devops/docker`: `docker compose up -d` | Container `booking-meeting-*` running |
| **PSET03-infra-task** | F-PS-01 | Health container | `docker compose ps` → **healthy** postgres & redis | Status healthy |
| **PSET04-infra-task** | P-01 | Port mapping | PG **5434→5432**, Redis **6379** | Selaras [compose](../../Devops/docker/docker-compose.yml) |
| **PSET05-infra-task** | F-PS-01 | Koneksi manual | Koneksi ke `127.0.0.1:5434` user `booking` | Login DB sukses |

**Gate keluar:** **F-PS-01** lulus.

---

## Fase 3 — Backend platform (schema, seed, API)

**Tujuan:** DB siap, data demo, health & API rooms (**F-PS-03–07**, **P-04**, **P-05**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-be-task** | F-PS-03, P-04 | Migrasi | `npm run db:migrate` | Exit 0 |
| **PSET02-be-task** | F-PS-03 | Constraint | `btree_gist` + exclusion (`drizzle/custom/`) | Overlap ditolak DB |
| **PSET03-be-task** | F-PS-04 | Seed | `npm run db:seed` | 5 ruang MR-A…E + user demo |
| **PSET04-be-task** | F-PS-04, §6.1 | DEV_USER_ID | UUID seed → `.env.local` | `DEV_USER_ID` terisi |
| **PSET05-be-task** | P-02 | Restart app | Restart `npm run dev` setelah env final | Load env fresh |
| **PSET06-be-task** | F-PS-06, P-05 | Health API | `GET /api/health` | `status: ok`, `db: true`, `redis: true` |
| **PSET07-be-task** | F-PS-07 | Rooms API | `GET /api/v1/rooms` | **200**, 5 ruang |
| **PSET08-be-task** | §10 | Error handling | DB down → JSON 503 jelas | Bukan body kosong |

**Gate keluar:** **P-05**; **F-PS-03–07** lulus.

---

## Fase 4 — Frontend & verifikasi design

**Tujuan:** UI lokal sesuai Design (**F-PS-05**, **F-PS-08**, **P-06**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-fe-task** | F-PS-05 | Dev server | `npm run dev` → `:3000` | `/book` load |
| **PSET02-fe-task** | §9, P-06 | `/rooms` | Daftar ruang | Tanpa "Permintaan gagal"; 5 entri |
| **PSET03-fe-task** | §9, P-06 | `/book` | Room picker + **Semua ruang** | 5 ruang; timeline 08–18 |
| **PSET04-fe-task** | P-06 | `/bookings` | Booking saya | Halaman load (kosong OK) |
| **PSET05-fe-task** | §6.1 | Dev banner | Banner / `x-dev-user-id` jika perlu | Client auth konsisten |
| **PSET06-fe-task** | F-PS-08 | Tema & token | CSS variables, Geist, dark | [design.md](./design.md) |

**Gate keluar:** **F-PS-08**; checklist design; item UI **§9** PRD.

---

## Fase 5 — Auth (dev & persiapan OIDC)

**Tujuan:** Auth lokal stabil; staging siap OIDC (**P-03**, **F-PS-S04**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-auth-task** | P-03 | Mode dev | `AUTH_MODE=dev`; `DEV_USER_ID` / header | `/api/v1/me` 200 |
| **PSET02-auth-task** | P-03 | Middleware | `/book`, `/rooms`, `/api/v1/*` di dev | Tanpa 401 tidak wajar |
| **PSET03-auth-task** | F-PS-S04, §6.1 | OIDC prep | `AUTH_SECRET`, `OIDC_*` staging (no commit) | Redirect URI IdP |
| **PSET04-auth-task** | F-PS-S04 | Login staging | `AUTH_MODE=oidc`; `/login` → callback | Session + `/api/v1/me` |

**Gate keluar:** Dev auth OK; OIDC staging terencana.

---

## Fase 6 — Worker & async (opsional lokal)

**Tujuan:** Redis queue + email worker (**F-PS-09**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-worker-task** | §6.1 | Redis env | `REDIS_URL` di `.env.local` | Health `redis: true` |
| **PSET02-worker-task** | F-PS-09 | Proses worker | `npm run worker:email` | Consumer connect |
| **PSET03-worker-task** | F-PS-09 | Job uji | Booking → job confirm / log bilingual | Log worker |

**Gate keluar:** **F-PS-09** (opsional untuk sign-off lokal minimal §9).

---

## Fase 7 — CI & kualitas build

**Tujuan:** Pipeline dan artefak build (**F-PS-S06**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-ci-task** | F-PS-S06 | Lint | `npm run lint` | Zero blocking error |
| **PSET02-ci-task** | F-PS-S06 | Unit test | `npm run test` | Vitest hijau |
| **PSET03-ci-task** | F-PS-S01 | Production build | `npm run build` | Next build sukses |
| **PSET04-ci-task** | F-PS-S06 | Pipeline | Adaptasi [.gitlab-ci.yml](../../.gitlab-ci.yml) | CI lint/test/build |

**Gate keluar:** **F-PS-S06** siap.

---

## Fase 8 — Ops staging & production

**Tujuan:** Deploy non-local (**F-PS-S01–S07**).

| Task ID | Ref PRD | Tahapan | Detail aktivitas | Output / verifikasi |
|---------|---------|---------|------------------|---------------------|
| **PSET01-ops-task** | F-PS-S01 | Image | Image web + CMD worker | Build & runbook |
| **PSET02-ops-task** | F-PS-S02 | Migrate job | Pre-deploy `db:migrate` | Job terdokumentasi |
| **PSET03-ops-task** | F-PS-S03 | Secrets | GitLab CI/CD Variables / vault | Tidak di git |
| **PSET04-ops-task** | F-PS-S04 | OIDC prod | Redirect prod; smoke login | `/login` OK |
| **PSET05-ops-task** | F-PS-S05 | Probes | LB/K8s → `/api/health` | Probe configured |
| **PSET06-ops-task** | F-PS-S07 | SMTP | `SMTP_*`, worker staging | Email bilingual |
| **PSET07-ops-task** | §8 | Release | Staging: `main`; Prod: tag `v*` | Architecture §8.4–8.5 |

**Gate keluar:** Topology staging = web + worker + PG + Redis + OIDC.

---

## Fase 9 — Sign-off & handover

**Tujuan:** Setup lokal diterima (**PRD §9**).

| Tahap | Ref PRD | Detail |
|-------|---------|--------|
| 9.1 | §9 | Centang acceptance lokal (Fase 1–4 wajib; 6 opsional) |
| 9.2 | §10 | Bagikan troubleshooting ke tim |
| 9.3 | §2 | Catat waktu onboarding (target ≤ 30 menit) |
| 9.4 | — | Handover ke [PRD produk](../PRD-Aplikasi-Booking-Ruang-Meeting.md) F-01–F-11 |

**Gate keluar:** Platform setup **Done** (local); staging/prod mengikuti Fase 7–8.

---

## Ringkasan urutan fase

```text
Fase 0 Kickoff     (P-01–P-06)
  → Fase 1 stack   (PS-01,03–05, F-PS-02)
  → Fase 2 infra   (PS-02, F-PS-01)
  → Fase 3 be      (F-PS-03–07)
  → Fase 4 fe      (F-PS-05,08, P-06)
  → Fase 5 auth    (P-03, F-PS-S04)
  → Fase 6 worker  (F-PS-09, opsional)
  → Fase 7 ci      (F-PS-S06)
  → Fase 8 ops     (F-PS-S01–S07)
  → Fase 9 sign-off (PRD §9)
```

---

## Traceability: Task PSET → ID PRD induk

| Task ID | ID PRD |
|---------|--------|
| PSET01–07-stack-task | PS-01, PS-03–05, F-PS-02, P-01, P-02 |
| PSET01–05-infra-task | PS-02, F-PS-01, P-01 |
| PSET01–08-be-task | F-PS-03–07, P-04, P-05, §10 |
| PSET01–06-fe-task | F-PS-05, F-PS-08, P-06, §9 |
| PSET01–04-auth-task | P-03, F-PS-S04 |
| PSET01–03-worker-task | F-PS-09 |
| PSET01–04-ci-task | F-PS-S06, F-PS-S01 |
| PSET01–07-ops-task | F-PS-S01–S07 |
| Fase 9 | PRD §9, §2, §10 |

---

*Akhir dokumen fase development platform setup v1.1.*
