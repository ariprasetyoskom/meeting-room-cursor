# Rencana Delivery — MVP ke Production
# Aplikasi Booking Ruang Meeting

| Metadata | |
|----------|---|
| **Dokumen** | PLAN-MVP-Delivery |
| **Versi** | **1.0** |
| **Tanggal** | 30 September 2026 |
| **Status** | Aktif — PO & engineering |
| **Dokumen Terkait** | [PRD v1.3](./PRD-Aplikasi-Booking-Ruang-Meeting.md) · [BRD §13](./BRD-Aplikasi-Booking-Ruang-Meeting.md) · [Architecture §8.6 QA](./Architecture-Aplikasi-Booking-Ruang-Meeting.md) · [RELEASE-NOTES](./RELEASE-NOTES.md) |

---

## 1. Ringkasan eksekutif

Implementasi **inti MVP** (booking, admin, audit, kalender Hari/Minggu) sudah ada di `Apps/web`. Sisa pekerjaan fokus pada **penutupan gap Must** (email bilingual D-3, SSO staging UAT), **kualitas rilis** (E2E, performance smoke, trace QA), dan **go-live staging/prod** — selaras timeline BRD ~11 minggu (posisi saat ini: **feature-complete lokal**, belum **release-ready**).

**Target rilis produk:** `v1.0.0` setelah Wave 1–3 lulus gate PRD §10 dan BRD §13.

---

## 2. Posisi fitur (PRD F-01 – F-12)

| ID | Fitur | Status impl. | Prioritas penutupan | Gelombang |
|----|-------|--------------|---------------------|-----------|
| F-01 | Login & session | Sebagian (dev + OIDC code) | **Must** — UAT IdP staging | W2 |
| F-02 | Daftar ruang | Selesai | — | — |
| F-03 | Detail ruang | Sebagian | **Should** — halaman `/rooms/[id]`; foto OQ-3 optional | W3 |
| F-04 | Kalender ruang | Selesai | — | — |
| F-05 | Buat booking | Selesai | — | — |
| F-06 | Booking saya | Selesai | — | — |
| F-07 | Cancel booking | Selesai | — | — |
| F-08 | Admin ruang | Selesai | — | — |
| F-09 | Admin bookings | Selesai | — | — |
| F-10 | Email notifications | Sebagian (queue/worker) | **Must** — SMTP + template D-3 + reminder | W1 |
| F-11 | Audit trail | Selesai | — | — |
| F-12 | Export CSV | Belum | **Could** — post v1.0.0 | W4+ |

**BRD §13 acceptance:** 6/8 item engineering ✅; **email bilingual** dan **KPI instrumentation** ⏳.

---

## 3. Definition of Done — MVP v1.0.0

| Gate | Kriteria | Pemilik |
|------|----------|---------|
| **G1 Functional** | F-01–F-11 sesuai PRD §4; BR-01–BR-08 teruji manual + otomatis where applicable | QA + Eng |
| **G2 D-1 / D-2 / D-3** | Cancel policy, organizer visible, email ID+EN terkirim di staging | PO + Facilities |
| **G3 OIDC** | `AUTH_MODE=oidc` di staging; login/logout UAT ≥ 3 user sample | IT + PO |
| **G4 CI/CD** | GitHub Actions hijau; deploy staging otomatis dari branch release | Eng |
| **G5 Non-func** | Health `db`+`redis`; k6 smoke P95 sesuai TDD NFR (calendar read, create) | Eng |
| **G6 UAT** | BRD §16 sign-off; zero P1 open | PO, Facilities, IT |

---

## 4. Gelombang delivery

### Wave 0 — Foundation (selesai)

- Monorepo, Drizzle + exclusion overlap, Docker PG **5434** / Redis **6379**
- UI `/book`, admin F-08–F-11, dev auth, GitHub Actions CI
- Platform setup lokal sign-off [000 §9](./000_platform_setup/PRD-Platform-Environment-Setup.md)
- F-04 Minggu (commit `89a8ab2`)

### Wave 1 — Email & async (2 minggu)

**Goal:** Tutup gap **F-10** dan BR-07 / D-3.

**Backlog ticket (24 item, epic W1-R/M/T/Q/S/O/V):** lihat **[PLAN-Wave-1-Email.md](./PLAN-Wave-1-Email.md)** — jadwal S4 minggu 1/2, dependency graph, CSV import.

| Task ID | Deliverable | Acceptance |
|---------|-------------|------------|
| W1-01 | Env SMTP + dokumentasi Ops (`SMTP_*`, `EMAIL_FROM`) | → **W1-M-***, **W1-O-*** |
| W1-02 | Template confirm/cancel bilingual (satu HTML, dua blok) | → **W1-T-*** + PO **W1-T-05** |
| W1-03 | Reminder job (default **1 jam** sebelum start, OQ-2) | → **W1-S-*** |
| W1-04 | Perbaikan koneksi Redis host→Docker (dev/staging) | → **W1-R-*** |
| W1-05 | Runbook worker `npm run worker:email` + staging container | → **W1-O-***, **W1-V-*** |

**Milestone sprint:** **M1** confirm di Mailhog (akhir minggu 1) · **M2** cancel + reminder + BRD §13 email (akhir minggu 2).

**Risiko:** deliverability → SPF/DKIM (Ops); mitigasi retry BullMQ (TDD §7).

### Wave 2 — Auth staging & deploy (2 minggu)

**Goal:** **F-01** production-like; environment staging nyata.

| Task ID | Deliverable | Acceptance |
|---------|-------------|------------|
| W2-01 | Staging env: `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, OIDC | Health OK; no dev fallback di prod |
| W2-02 | IdP app registration (Azure/Keycloak) | IT ticket closed; redirect URI staging |
| W2-03 | UAT script: login, book, cancel, admin | 3 persona (employee ×2, admin ×1) |
| W2-04 | Merge branch scaffold → `main` / `release/1.0.0` | CI green on RC |
| W2-05 | Seed staging anonymized | Facilities validate 5+ ruang |

### Wave 3 — Quality & observability (2 minggu)

**Goal:** Architecture §8.6 exit; PRD §7 minimal.

| Task ID | Deliverable | Acceptance |
|---------|-------------|------------|
| W3-01 | Trace matrix PRD F-xx ↔ FR ↔ test case | Doc signed QA |
| W3-02 | Playwright smoke: book, conflict 409, cancel window | Green on staging RC |
| W3-03 | k6: 100 VU read calendar, 20 VU create | P95 within TDD targets |
| W3-04 | Event hook: `booking_created`, `booking_cancelled`, `booking_conflict` | Log/analytics sink documented |
| W3-05 | Dependency scan + ZAP baseline staging | No critical unmitigated |

**Optional same wave:** F-03 halaman detail ruang (tanpa foto) — FR-05/06 UX.

### Wave 4 — Post-MVP & Fase 2 prep (backlog)

| Item | PRD | Catatan |
|------|-----|---------|
| F-12 export CSV | Could | Admin date range |
| F-04 multi-ruang week grid | Enhancement | Saat ini 1 ruang per grid |
| Foto ruang | OQ-3 | Jika asset Facilities ready |
| PWA | OQ-4 | Evaluasi pasca KPI 90 hari |
| Calendar sync, recurring, QR check-in | BRD §3.2 | Fase 2 |

---

## 5. Backlog terprioritisasi (MoSCoW)

### Must (blok v1.0.0)

1. **PLN-001** — Email confirm/cancel/reminder bilingual (F-10, D-3, US-08)
2. **PLN-002** — OIDC staging UAT (F-01, FR-01)
3. **PLN-003** — Deploy staging + runbook ops (Architecture §8.4)
4. **PLN-004** — Regression E2E smoke (Architecture §8.6)
5. **PLN-005** — BRD §13 item email + sign-off §16

### Should

6. **PLN-006** — KPI events minimal (PRD §7, US-10)
7. **PLN-007** — Halaman detail ruang `/rooms/[code]` (F-03)
8. **PLN-008** — k6 performance gate
9. **PLN-009** — Redis reliability dev/staging

### Could / Won't (MVP)

10. **PLN-010** — F-12 CSV export  
11. **PLN-011** — Week view multi-ruang paralel  
12. **PLN-012** — Magic link auth (hanya jika IT tolak OIDC timeline)

---

## 6. Pemetaan sprint indikatif

Asumsi sprint **2 minggu**, mulai **6 Oktober 2026**.

| Sprint | Tanggal | Fokus | Exit |
|--------|---------|-------|------|
| **S4** | 6–17 Okt | Wave 1 email + Redis | F-10 demo di staging Mailhog |
| **S5** | 20–31 Okt | Wave 2 OIDC + deploy staging | UAT login SSO |
| **S6** | 3–14 Nov | Wave 3 QA + KPI + E2E | RC `v1.0.0-rc.1` |
| **S7** | 17–28 Nov | Hardening, P1 fix, UAT sign-off | **Go-live staging** → prod window |

Slack buffer 1 minggu untuk IT/Ops dependencies.

---

## 7. Dependencies eksternal

| Dependency | Blocker untuk | Owner | SLA target |
|------------|---------------|-------|------------|
| IdP OIDC credentials + redirect URI | W2, G3 | IT Security | Sebelum S5 |
| SMTP / SendGrid + SPF/DKIM | W1, G2 | IT Ops | Sebelum S4 mid |
| Daftar ruang produksi / kapasitas final | UAT Facilities | Workplace | Sebelum S6 |
| Staging URL + TLS cert | W2-01 | IT Ops | Awal S5 |
| Change comms HR | Go-live | HR | S7 |

---

## 8. Trace ringkas (PRD → bukti uji)

| PRD | FR utama | Test / bukti direncanakan |
|-----|----------|---------------------------|
| F-05 | FR-07 | Unit policy + API 409 + E2E create |
| F-07 | FR-09 | E2E cancel window & non-organizer 403 |
| F-10 | FR-14 | Snapshot template ID/EN; inbox staging |
| F-01 | FR-01 | Manual UAT OIDC + session persist |
| F-04 | FR-08 | Visual week grid + booking span slot |
| F-11 | FR-16 | Admin audit filter date |

Matrix lengkap: artefak QA **Wave 3** (`Docs/qa/` — direncanakan; buat saat S6 kickoff).

---

## 9. Risiko delivery

| Risiko | Probabilitas | Mitigasi (plan) |
|--------|--------------|-----------------|
| SMTP delay | Medium | Parallel Mailhog dev; PO accept log-only demo sementara |
| OIDC misconfig | Medium | Checklist env TDD §9; dev mode fallback hanya lokal |
| Scope F-03 foto | Low | Defer OQ-3; ship detail text-only |
| Redis Windows dev | Medium | Doc `127.0.0.1`; staging Linux container |
| KPI vendor belum dipilih | Low | Structured log + export CSV log interim |

---

## 10. Keputusan produk terbuka (untuk PO)

| ID | Pertanyaan | Rekomendasi | Deadline |
|----|------------|-------------|----------|
| **PD-1** | Reminder 1 jam vs 24 jam (OQ-2) | Tetap **1 jam**; env override | Akhir S4 |
| **PD-2** | F-03 detail ruang in v1.0.0? | **Should** — tanpa foto | Sprint planning S5 |
| **PD-3** | F-12 CSV in v1.0.0? | **Defer** ke v1.1 | Akhir S5 |
| **PD-4** | Target go-live prod | Staging sign-off S7 → prod cutover | PO calendar |

---

## 11. Checklist mingguan PO (ringkas)

- [ ] Backlog Must (PLN-001–005) tidak ada blocker dependency > 3 hari
- [ ] Demo staging setiap akhir sprint (book → email → cancel)
- [ ] Delta PRD §4.1 di-update jika status F-xx berubah
- [ ] RELEASE-NOTES draft untuk RC

---

## 12. Dokumen terkait

| Dokumen | Path |
|---------|------|
| PRD | [./PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) |
| BRD acceptance | [./BRD-Aplikasi-Booking-Ruang-Meeting.md](./BRD-Aplikasi-Booking-Ruang-Meeting.md) §13–§16 |
| TDD email & env | [./TDD-Aplikasi-Booking-Ruang-Meeting.md](./TDD-Aplikasi-Booking-Ruang-Meeting.md) §6–§7 |
| Platform setup | [./000_platform_setup/README.md](./000_platform_setup/README.md) |
| Release notes | [./RELEASE-NOTES.md](./RELEASE-NOTES.md) |
| Wave 1 ticket detail | [./PLAN-Wave-1-Email.md](./PLAN-Wave-1-Email.md) |

---

*Akhir dokumen PLAN-MVP-Delivery v1.0.*
