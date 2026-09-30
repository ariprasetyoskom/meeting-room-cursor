# Release Notes — Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Versi** | **0.1.0-mvp** (pre-release) |
| **Tanggal** | 30 September 2026 |
| **Branch / tag** | `cursor/meeting-room-web-scaffold` · commit [`a00a735`](https://github.com/ariprasetyoskom/meeting-room-cursor/commit/a00a735) |
| **Repo** | [github.com/ariprasetyoskom/meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor) |
| **CI** | GitHub Actions — [workflow CI](https://github.com/ariprasetyoskom/meeting-room-cursor/actions/workflows/ci.yml) ✅ (run terakhir sukses pada `a00a735`) |

---

## Ringkasan

Rilis ini men deliver **MVP internal** aplikasi booking ruang meeting: monorepo `Docs/` + `Apps/web/` + `Devops/`, alur booking karyawan, panel admin fasilitas, auth dev/OIDC, dan pipeline CI. Belum production go-live — staging deploy masih placeholder; email SMTP penuh dan UAT formal menyusul.

---

## Fitur utama (produk)

| Area | ID PRD | Isi rilis |
|------|--------|-----------|
| Booking | F-04, F-05 | Kalender **Hari** + **Minggu** (7 hari per ruang) + daftar; picker **5 ruang**; modal booking; anti-bentrok |
| Ruang | F-02 | Daftar ruang + filter kapasitas |
| Booking saya | F-06, F-07 | List booking, cancel organizer (window D-1) |
| Admin | F-08, F-09, F-11 | CRUD ruang, semua booking + cancel dengan alasan, audit log |
| Auth | F-01 | `AUTH_MODE=dev` + OIDC (Auth.js); session & profil |
| Email | F-10 | Queue BullMQ + worker (log/dev); **SMTP bilingual belum** |
| UI | — | App shell modern (`BrandLogo`, header sticky, nav pill), Geist, dark mode |

Detail status per fitur: [PRD §4.1](./PRD-Aplikasi-Booking-Ruang-Meeting.md).

---

## Platform & developer experience

- **Docker lokal:** Postgres **5434**, Redis **6379** — [Devops/docker](../Devops/docker/README.md)
- **Env:** `.env.local` + `loadAppEnv()` (Windows / P-02)
- **Sign-off setup lokal:** [PRD Platform §9](./000_platform_setup/PRD-Platform-Environment-Setup.md)
- **Agentic skills:** generator BRD & ringkasan platform — [Agentic/README.md](../Agentic/README.md)

---

## Dokumentasi (versi selaras)

| Dokumen | Versi |
|---------|-------|
| BRD | 1.2 |
| PRD | 1.2 |
| Architecture | 1.3 |
| TDD | 1.1 |
| Design | 1.1 |

Indeks: [Docs/README.md](./README.md)

---

## DevOps & CI/CD

- **CI:** `.github/workflows/ci.yml` — lint, `tsc`, unit test, integration test (Postgres + Redis + migrate), build
- **Perbaikan build CI (`a00a735`):** `/api/health` force-dynamic; Redis lazy connect; job build tanpa dependency DB/Redis live
- **Deploy staging:** job placeholder (belum infra nyata)

---

## Breaking / migration

Tidak ada rilis production sebelumnya. Setup baru:

```powershell
cd Devops\docker && docker compose up -d
cd Apps\web
copy .env.example .env.local
npm install && npm run db:migrate && npm run db:seed
# Set DEV_USER_ID dari output seed
npm run dev
```

---

## Known issues & backlog

| Item | Catatan |
|------|---------|
| F-04 minggu multi-ruang sekaligus | Minggu = satu ruang per grid (pilih kartu ruang) |
| F-10 email | SMTP + template bilingual ID/EN belum prod |
| F-12 export CSV | Post-MVP |
| OIDC staging UAT | Belum sign-off IdP |
| KPI analytics | PRD §7 belum di-wire |
| Playwright E2E | Backlog |
| Commit historis CI | `2075426` dan sebelum fix build — workflow merah; gunakan **`a00a735`** sebagai baseline hijau |

Acceptance bisnis: [BRD §13](./BRD-Aplikasi-Booking-Ruang-Meeting.md) — 6/8 item engineering done; email + KPI pending.

---

## Changelog (commit highlights, branch scaffold)

| Commit | Ringkas |
|--------|---------|
| `b3d3aa0` | Monorepo + scaffold MVP |
| `24e34dd` | Booking UI + Auth.js OIDC |
| `9f9fdb4` | Drizzle + Docker PG 5434 |
| `e2901ac` | Room picker 5 ruang + seed |
| `00e869b` | Admin UI F-08–F-11 |
| `6b84b9f` | Dev auth/UI stabil + GitLab CI (diganti kemudian) |
| `d0d9d14` | Sign-off platform §9 |
| `d37d992` | GitHub Actions CI |
| `224256a` | Logo + header modern |
| `2075426` | Selaraskan BRD/PRD/Architecture |
| `99aa89a` | Skill Agentic + template dokumen |
| `eb4ef16` | Selaraskan docs (Design 1.1, Agentic index) |
| `a00a735` | Fix CI build |

---

## Rencana rilis berikutnya (0.2.0 → v1.0.0)

Ikuti **[PLAN-MVP-Delivery](./PLAN-MVP-Delivery.md)** (PRD §4.2):

1. **Wave 1** — F-10 SMTP + email bilingual (D-3) + Redis staging  
2. **Wave 2** — Deploy staging + OIDC UAT (F-01)  
3. **Wave 3** — Playwright/k6, KPI §7, RC `v1.0.0-rc.1`, BRD §16 sign-off  
4. **Post-MVP** — F-12 CSV, detail ruang F-03, enhancement kalender  

F-04 Minggu ✅ (PRD v1.3).

---

*Maintainer: tim engineering · Product: Booking Ruang Meeting MVP*
