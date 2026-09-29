# Product Requirements Document (PRD)
# Platform & Environment Setup

| Metadata | |
|----------|---|
| **Dokumen** | PRD-Platform-Environment-Setup |
| **Seri** | `Docs/000_platform_setup` |
| **Versi** | **1.1** |
| **Tanggal** | 29 September 2026 |
| **Status** | Approved for engineering |
| **Bahasa** | Indonesia |
| **Dokumen Terkait** | [Fase development (PSET)](./PRD_platform_setup_development_phase.md) · [arsitektur](./arsitektur.md) · [techstack](./techstack.md) · [design](./design.md) · [Architecture v1.2](../Architecture-Aplikasi-Booking-Ruang-Meeting.md) · [TDD v1.1](../TDD-Aplikasi-Booking-Ruang-Meeting.md) · [Design v1.0](../Design-Aplikasi-Booking-Ruang-Meeting.md) |

---

## 1. Ringkasan

PRD ini mendefinisikan **persyaratan setup lingkungan** agar tim dapat menjalankan, memverifikasi, dan mendeploy aplikasi Booking Ruang Meeting secara konsisten. Cakupan: **local**, **staging**, dan **production**, selaras:

- **Arsitektur** — container, ADR, health, deployment ([arsitektur.md](./arsitektur.md))
- **Tech stack** — Node, Next.js, Drizzle, Docker ports, scripts ([techstack.md](./techstack.md))
- **Design** — smoke test UI pasca-setup ([design.md](./design.md))

Produk fungsional (booking, cancel, email) tetap di [PRD aplikasi](../PRD-Aplikasi-Booking-Ruang-Meeting.md); dokumen ini fokus **platform & env**.

**Eksekusi tahapan:** urutan runbook dan task ID **`PSET{yy}-{kanonik}-task`** ada di [PRD_platform_setup_development_phase.md](./PRD_platform_setup_development_phase.md) (Fase 0–9). PRD ini = *what*; dokumen fase = *how & when*.

---

## 2. Tujuan & Metrik Sukses

| Tujuan | Metrik sukses |
|--------|----------------|
| Developer baru bisa jalan lokal ≤ 30 menit | Checklist §9 lulus tanpa bantuan |
| Zero ambiguity stack | Satu tabel env vars §6; port PG **5434** dokumentasi |
| Staging mirror prod topology | Web + worker + PG + Redis + OIDC |
| UI dapat diverifikasi setelah setup | Checklist [design.md](./design.md) |

---

## 3. Persona

| Persona | Kebutuhan |
|---------|-----------|
| **Application Developer** | Docker, migrate, seed, dev auth, hot reload |
| **DevOps / IT Ops** | Compose, CI secrets, migrasi deploy, health probes |
| **QA** | Staging URL, seed data, OIDC test user |
| **Product / UX** | Preview lokal sesuai Design (5 ruang, `/book`) |

---

## 4. Prasyarat (Global)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| PS-01 | Node.js **20 LTS** terpasang | Must |
| PS-02 | Docker Desktop / Engine + Compose v2 | Must (lokal) |
| PS-03 | Git clone monorepo `Docs/`, `Apps/web`, `Devops/` | Must |
| PS-04 | Port bebas: **3000** (web), **5434** (PG host), **6379** (Redis) | Must |
| PS-05 | Akses baca `.env.example`; salin ke `.env.local` (gitignored) | Must |

### 4.1 Pemetaan prasyarat → fase development

| ID | Fase | Task PSET (indicatif) |
|----|------|------------------------|
| PS-01 | 1 | `PSET01-stack-task` |
| PS-02 | 2 | `PSET01-infra-task` |
| PS-03 | 1 | `PSET02-stack-task` |
| PS-04 | 1 | `PSET03-stack-task` |
| PS-05 | 1 | `PSET04-stack-task`, `PSET05-stack-task` |

---

## 5. Keputusan Platform (Locked)

| ID | Keputusan | Rujukan |
|----|-----------|---------|
| **P-01** | Postgres dev di Docker map **5434→5432** (hindari bentrok PG lokal) | [techstack](./techstack.md), [Devops/docker](../../Devops/docker/docker-compose.yml) |
| **P-02** | `.env.local` **menang** atas env OS untuk DB di development (via `loadAppEnv`) | TDD, `Apps/web/src/db/index.ts` |
| **P-03** | Auth lokal default **`AUTH_MODE=dev`**; staging/prod **`oidc`** | Architecture §3.3, TDD §6 |
| **P-04** | Migrasi DB wajib sebelum seed dan sebelum smoke API | ADR-006 |
| **P-05** | Health gate: `db: true` sebelum sign-off setup lokal | Architecture §8.3 |
| **P-06** | UI smoke: `/rooms`, `/book`, `/bookings` load tanpa error generik | [design](./design.md) |

### 5.1 Pemetaan keputusan → fase / task

| ID | Fase | Verifikasi (PSET) |
|----|------|-------------------|
| P-01 | 2 | `PSET04-infra-task` |
| P-02 | 1, 3 | `PSET07-stack-task`, `PSET05-be-task` |
| P-03 | 5 | `PSET01-auth-task`, `PSET04-auth-task` |
| P-04 | 3 | `PSET01-be-task` |
| P-05 | 3 | `PSET06-be-task` |
| P-06 | 4 | `PSET02-fe-task` … `PSET04-fe-task` |

---

## 6. Environment Variables

### 6.1 Matriks

| Variable | Local | Staging | Prod | Deskripsi |
|----------|-------|---------|------|-----------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL staging | URL prod | Base URL app |
| `DATABASE_URL` | `…@127.0.0.1:5434/booking_meeting` | managed PG | managed PG | Koneksi Drizzle |
| `REDIS_URL` | `redis://localhost:6379` | managed Redis | managed Redis | BullMQ / rate limit |
| `AUTH_MODE` | `dev` | `oidc` | `oidc` | Mode autentikasi |
| `DEV_USER_ID` | UUID dari seed | — | — | Dev only |
| `AUTH_SECRET` | opsional dev | **wajib** | **wajib** | ≥32 karakter |
| `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | opsional | wajib | wajib | SSO |
| `BOOKING_MIN_LEAD_MINUTES` | 15 | 15 | 15 | Policy |
| `BOOKING_CANCEL_WINDOW_HOURS` | 1–2 | 1 | 1 | Policy (selaras PRD D-1) |
| `SMTP_*`, `EMAIL_FROM` | opsional | wajib | wajib | Email worker |

Template: [Apps/web/.env.example](../../Apps/web/.env.example).

### 6.2 Larangan

- Jangan commit `.env.local`, credential, atau `AUTH_SECRET` produksi.
- Jangan gunakan password Docker dev di staging/prod.

---

## 7. Fitur Setup — Local (F-PS)

| ID | Fitur | Fase | Task PSET | Acceptance criteria |
|----|-------|------|-----------|---------------------|
| **F-PS-01** | Infra Docker | 2 | `PSET02-infra-task` … `PSET05-infra-task` | `docker compose up -d` → Postgres + Redis **healthy** |
| **F-PS-02** | Install deps | 1 | `PSET06-stack-task` | `npm install` di `Apps/web` sukses |
| **F-PS-03** | Migrasi DB | 3 | `PSET01-be-task`, `PSET02-be-task` | `npm run db:migrate` sukses; `btree_gist` + exclusion ada |
| **F-PS-04** | Seed data | 3 | `PSET03-be-task`, `PSET04-be-task` | 5 ruang MR-A…E + user demo; `DEV_USER_ID` di `.env.local` |
| **F-PS-05** | Dev server | 4 | `PSET01-fe-task` | `npm run dev` → `:3000` |
| **F-PS-06** | Health OK | 3 | `PSET06-be-task` | `GET /api/health` → `"status":"ok"`, `"db":true`, `"redis":true` |
| **F-PS-07** | API rooms | 3 | `PSET07-be-task` | `GET /api/v1/rooms` → 200 + 5 ruang (dev auth) |
| **F-PS-08** | UI smoke | 4 | `PSET02-fe-task` … `PSET06-fe-task` | Checklist [design.md](./design.md) |
| **F-PS-09** | Worker (opsional) | 6 | `PSET01-worker-task` … `PSET03-worker-task` | `npm run worker:email` jalan jika `REDIS_URL` set |

### 7.1 Urutan eksekusi (selaras fase development)

Ikuti **Fase 1 → 2 → 3 → 4** untuk sign-off lokal minimal; Fase 5–6 disarankan; Fase 7–8 untuk staging/prod; Fase 9 sign-off.

```powershell
# Fase 1 — stack (PS-01, PS-03–05, F-PS-02)
cd D:\Cursor\Apps\web
copy .env.example .env.local
# DATABASE_URL …5434…, AUTH_MODE=dev, REDIS_URL, NEXT_PUBLIC_APP_URL
npm install

# Fase 2 — infra (PS-02, F-PS-01)
cd D:\Cursor\Devops\docker
docker compose up -d

# Fase 3 — be (F-PS-03, 04, 06, 07)
cd D:\Cursor\Apps\web
npm run db:migrate
npm run db:seed
# Set DEV_USER_ID di .env.local; restart dev server nanti

# Fase 4 — fe (F-PS-05, 08)
npm run dev
```

Detail per task: [PRD_platform_setup_development_phase.md](./PRD_platform_setup_development_phase.md). Referensi singkat: [Apps/web/README.md](../../Apps/web/README.md), [Devops/docker/README.md](../../Devops/docker/README.md).

---

## 8. Fitur Setup — Staging & Production (F-PS-S)

| ID | Fitur | Fase | Task PSET | Acceptance criteria |
|----|-------|------|-----------|---------------------|
| **F-PS-S01** | Container image | 8 | `PSET01-ops-task` | `next build` sukses; image web + worker terdokumentasi |
| **F-PS-S02** | Pre-deploy migrate | 8 | `PSET02-ops-task` | Job migrasi sebelum traffic (Architecture §8.4) |
| **F-PS-S03** | Secrets | 8 | `PSET03-ops-task` | GitLab CI/CD Variables / vault; tidak di repo |
| **F-PS-S04** | OIDC | 5, 8 | `PSET03-auth-task`, `PSET04-auth-task`, `PSET04-ops-task` | Redirect URI terdaftar; login `/login` sukses |
| **F-PS-S05** | Health probes | 8 | `PSET05-ops-task` | K8s/LB pakai `/api/health` |
| **F-PS-S06** | CI | 7 | `PSET01-ci-task` … `PSET04-ci-task` | Lint, test, build hijau ([.gitlab-ci.yml](../../.gitlab-ci.yml)) |
| **F-PS-S07** | SMTP | 8 | `PSET06-ops-task` | Email worker bilingual (D-3) di staging |

Staging deploy trigger target: merge `main` (Architecture §8.4). Production: approval / tag `v*`.

---

## 9. Acceptance Criteria (Sign-off Setup Lokal)

Setara **Fase 9** development phase; centang setelah Fase 1–4 (minimal) selesai.

- [ ] **PS-01–PS-05** — Fase 1–2 gate terpenuhi.
- [ ] **P-01, P-02** — `PSET05-stack-task`, `PSET07-stack-task`; health `db: true` (`PSET06-be-task`).
- [ ] **F-PS-01–F-PS-08** — Fase 2–4 gate (F-PS-09 opsional Fase 6).
- [ ] UI §9: `/rooms` tanpa "Permintaan gagal"; `/book` **5** ruang (`PSET02-fe-task`, `PSET03-fe-task`).
- [ ] **P-03** dev auth — `PSET01-auth-task`, `PSET02-auth-task`.
- [ ] Env vars §6 selaras `.env.example`.

---

## 10. Troubleshooting

| Gejala | Penyebab umum | Mitigasi |
|--------|---------------|----------|
| `ERR_CONNECTION_REFUSED :3000` | Dev server mati | `npm run dev` |
| Health `db: false` | PG down / URL salah / port 5433 vs 5434 | Cek Docker; perbaiki `.env.local`; restart dev |
| `password authentication failed` | PG salah instance (env OS) | P-02; hapus `DATABASE_URL` global Windows atau gunakan 5434 |
| `/rooms` "Permintaan gagal" | API 5xx / DB | Health + log server |
| 401 API | Dev: tanpa `DEV_USER_ID` | Seed + `.env.local` atau banner dev |
| Redis false di health | Redis container off | `docker compose up -d redis` |

---

## 11. Non-Functional (Setup)

| Kategori | Requirement |
|----------|-------------|
| Reproducibility | Satu compose file; versi PG/Redis pinned di image tag |
| Time-to-first-run | ≤ 30 menit (developer standar) |
| Dokumentasi | README platform + tiga ringkasan arsitektur/stack/design |
| Security | `.gitignore` env; credential dev tidak di production |

---

## 12. Out of Scope

- Provision cloud Terraform/K8s penuh (placeholder [Devops/infra](../../Devops/infra/README.md)).
- Setup IdP perusahaan (ticket IT).
- PWA / CDN (OQ-4 PRD produk).

---

## 13. Traceability

### 13.1 PRD → Architecture / TDD / Design

| Setup PRD | Fase | Architecture | TDD | Design |
|-----------|------|--------------|-----|--------|
| F-PS-01, P-01 | 2 | §6 local, §3.2 | §2 local dev | — |
| F-PS-03 | 3 | ADR-002, ADR-006 | §4 | — |
| F-PS-06 | 3 | §8.3 health | §5.5 | — |
| F-PS-08 | 4 | §3.3 UI | §8 | checklist |
| F-PS-S01–S07 | 7–8 | §8.4 CI/CD | §12 deploy | — |
| P-03 | 5 | §3.3 Auth | §6 | auth modes |

### 13.2 PRD ID → fase development (indeks)

| ID PRD | Fase | Dokumen fase |
|--------|------|----------------|
| PS-*, P-* | 0–2, 4–5 | §Fase 0–2, 4–5 |
| F-PS-* | 1–4, 6 | §Fase 1–4, 6 |
| F-PS-S* | 5, 7–8 | §Fase 5, 7–8 |
| §9 sign-off | 9 | §Fase 9 |

---

## 14. Dokumen Terkait

| Dokumen | Path |
|---------|------|
| Fase development (task PSET) | [./PRD_platform_setup_development_phase.md](./PRD_platform_setup_development_phase.md) |
| Indeks platform setup | [./README.md](./README.md) |
| Ringkasan arsitektur | [./arsitektur.md](./arsitektur.md) |
| Ringkasan tech stack | [./techstack.md](./techstack.md) |
| Ringkasan design verify | [./design.md](./design.md) |
| Indeks Docs utama | [../README.md](../README.md) |

---

*Akhir dokumen PRD Platform Environment Setup v1.1.*
