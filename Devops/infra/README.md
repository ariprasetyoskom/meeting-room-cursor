# Infrastructure (Placeholder)

Folder ini reserved untuk **Infrastructure as Code** dan manifest deployment produksi **Booking Ruang Meeting**.

## Planned Contents

| Area | Tool (candidate) | Notes |
|------|------------------|-------|
| Cloud resources | Terraform | VPC, managed Postgres, Redis, container registry |
| Kubernetes | Helm / Kustomize | Deploy `web` + `email-worker` |
| Secrets | Vault / cloud secret manager | OIDC, SMTP, `DATABASE_URL` |
| DNS & TLS | Cloud LB + cert manager | Internal hostname |

## Reference Architecture

- Container & deployment view: [../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md](../../Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md) §3.2, §6
- Observability: same document §8.3
- CI/CD deploy stages: [../../.gitlab-ci.yml](../../.gitlab-ci.yml) · [../ci/README.md](../ci/README.md)

## Local Parity

Development menggunakan [../docker/docker-compose.yml](../docker/docker-compose.yml) — **bukan** untuk production.

## Status

Belum ada modul Terraform/K8s di workspace ini. Tambahkan modul per environment (`staging`, `production`) saat tim infra siap, dengan review Security dan backup RPO/RTO sesuai BRD NFR.
