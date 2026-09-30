# CI/CD — GitHub Actions

Pipeline continuous integration untuk monorepo **Apps/web**, selaras dengan [Architecture §8.4](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## File pipeline

| Path | Fungsi |
|------|--------|
| [../../.github/workflows/ci.yml](../../.github/workflows/ci.yml) | Workflow GitHub Actions (aktif saat repo di GitHub) |
| [github/ci.yml.example](./github/ci.yml.example) | Pointer referensi |

GitHub mengeksekusi workflow di **`.github/workflows/*.yml`**.

## Jobs pipeline

1. **lint** — ESLint + `tsc --noEmit`
2. **unit-test** — Vitest
3. **integration-test** — Postgres 15 + Redis 7 service containers + `db:migrate` + `npm test`
4. **build** — `next build`
5. **deploy-staging** — placeholder on push to `main` (GitHub Environment `staging`)

## Branch policy

Lihat Architecture [§8.5 Branch Management](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## Variabel & secrets (GitHub)

Set di **Settings → Secrets and variables → Actions**; untuk deploy gunakan **Environments** `staging` / `production`:

| Secret / variable | Usage |
|-------------------|--------|
| `DATABASE_URL` | Deploy migrate / integrasi |
| `AUTH_SECRET` | Runtime staging/prod |

Release production: approval manual atau tag `v*` (Architecture §8.4).

## QA gate

Release production: checklist Architecture [§8.6 QA](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md) + UAT BRD §13.

## Hubungkan repo ke GitHub

```powershell
# Buat repo kosong di github.com, lalu:
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin cursor/meeting-room-web-scaffold
```

Atau dengan [GitHub CLI](https://cli.github.com/): `gh auth login` lalu `gh repo create <nama> --private --source=. --remote=origin --push`.
