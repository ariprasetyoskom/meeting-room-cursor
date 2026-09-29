# CI/CD

Contoh pipeline continuous integration untuk monorepo **Apps/web**, selaras dengan [Architecture §8.4](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## GitHub Actions

File contoh: [github/ci.yml.example](./github/ci.yml.example)

Salin ke repositori GitHub:

```text
.github/workflows/ci.yml
```

Sesuaikan path jika root repo bukan monorepo `D:\Cursor`.

## Stage Pipeline

1. **Lint & Typecheck** — ESLint, TypeScript
2. **Unit tests**
3. **Integration tests** — Postgres service + exclusion constraint cases
4. **Build** — Next.js + worker
5. **Deploy staging** — on `main` (opsional, butuh secrets)
6. **E2E** — nightly atau pre-release (Playwright)

## Branch Policy

Lihat Architecture [§8.5 Branch Management](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md).

## Secrets (GitHub Environments)

| Secret | Usage |
|--------|--------|
| `DATABASE_URL` | Integration job / deploy migrate |
| `AUTH_SECRET` | Build/runtime staging |
| `CONTAINER_REGISTRY_*` | Push image |

## QA Gate

Release ke production memerlukan checklist Architecture [§8.6 QA](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md) dan UAT sign-off BRD.
