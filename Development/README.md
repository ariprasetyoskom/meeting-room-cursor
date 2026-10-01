# Development — artefak lokal alur otomatis

Folder ini menampung output **non-produksi** untuk orkestrasi development (KAD, ORCH, agent).

| Path | Isi |
|------|-----|
| [`logs/`](./logs/) | Log terpusat (JSON Lines), ledger dispatch kanban |

Acuan arsitektur: [Docs/Architecture-Development-Orchestration.md](../Docs/Architecture-Development-Orchestration.md).

Log tidak di-commit (lihat `.gitignore` di root). Override path: env `DEVELOPMENT_LOG_DIR` di `Apps/web/.env.local`.
