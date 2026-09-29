# DevOps

Operasional development, CI/CD, dan infrastruktur untuk **Booking Ruang Meeting**.

## Subfolder

| Path | Purpose |
|------|---------|
| [docker/](./docker/README.md) | Postgres 15 + Redis 7 untuk development lokal |
| [ci/](./ci/README.md) | Contoh pipeline GitHub Actions |
| [infra/](./infra/README.md) | Placeholder Terraform / Kubernetes |

## Arsitektur Referensi

- Observability, CI/CD, branch strategy, QA: [../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md](../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md) §8.3–8.6
- Container diagram & ADR: same document §3, §7

## Environments

| Env | Deploy trigger (target) |
|-----|-------------------------|
| local | `docker compose up` |
| staging | merge to `main` (CI) |
| production | approved release tag |

Secrets tidak disimpan di repo — gunakan GitHub Environments / vault produksi.
