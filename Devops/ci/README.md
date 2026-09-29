# CI/CD — GitLab

Pipeline continuous integration untuk monorepo **Apps/web**, selaras dengan [Architecture §8.4](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## File pipeline

| Path | Fungsi |
|------|--------|
| [../../.gitlab-ci.yml](../../.gitlab-ci.yml) | Pipeline GitLab (aktif saat repo di GitLab) |
| [gitlab/](./gitlab/) | Pointer referensi ke root |

GitLab hanya mengeksekusi **`.gitlab-ci.yml` di root** repositori.

## Stage pipeline

1. **lint** — ESLint + `tsc --noEmit`
2. **test** — Vitest unit; job integrasi dengan service Postgres 15 + Redis 7 + `db:migrate`
3. **build** — `next build` (artifact `.next/`)
4. **deploy** — placeholder deploy staging on branch `main`

## Branch policy

Lihat Architecture [§8.5 Branch Management](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## Variabel & secrets (GitLab)

Set di **Settings → CI/CD → Variables** (protected/masked untuk production):

| Variable | Usage |
|----------|--------|
| `DATABASE_URL` | Override integrasi / deploy migrate |
| `AUTH_SECRET` | Runtime staging/prod |
| `CI_REGISTRY_*` | Push image container (opsional) |

Gunakan **Environments** `staging` / `production` untuk approval manual deploy prod (tag `v*`).

## QA gate

Release production: checklist Architecture [§8.6 QA](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md) + UAT BRD §13.

## Migrasi dari GitHub Actions

Contoh GitHub Actions lama dihapus; gunakan stage yang sama di `.gitlab-ci.yml`.
