# Getting Started

## Prasyarat

- **Node.js 20+**
- **Docker Desktop** (Postgres + Redis)
- **Git** + akses repo [meeting-room-cursor](https://github.com/ariprasetyoskom/meeting-room-cursor)

## 1. Infra lokal

```powershell
cd Devops\docker
docker compose up -d
docker ps
```

Harus healthy: `booking-meeting-postgres` (port **5434**), `booking-meeting-redis` (**6379**).

## 2. Aplikasi web

```powershell
cd Apps\web
copy .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
```

Dari output seed, set `DEV_USER_ID` di `.env.local`.

Disarankan:

```env
REDIS_URL=redis://127.0.0.1:6379
AUTH_SECRET=dev-auth-secret-min-32-chars-long!!
```

## 3. Jalankan

```powershell
npm run dev
```

Buka http://localhost:3000/book

Verifikasi:

```powershell
curl http://127.0.0.1:3000/api/health
```

Target: `"db":true` (redis boleh false di Windows dev — lihat [Troubleshooting](Troubleshooting)).

## 4. Worker email (opsional)

Terminal kedua, jika `REDIS_URL` terisi:

```powershell
npm run worker:email
```

## 5. Auth mode

| Mode | Env | Pakai |
|------|-----|--------|
| **dev** | `AUTH_MODE=dev` | Banner Dev user / `DEV_USER_ID` |
| **oidc** | `AUTH_MODE=oidc` + `OIDC_*` | `/login` SSO |

Detail: [Apps/web/README](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Apps/web/README.md)

## Dokumen setup lengkap

[000_platform_setup](https://github.com/ariprasetyoskom/meeting-room-cursor/tree/cursor/meeting-room-web-scaffold/Docs/000_platform_setup)
