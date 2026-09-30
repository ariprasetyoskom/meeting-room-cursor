# Design — Verifikasi Environment Lokal

Ringkasan untuk **smoke test UI** setelah setup. Source of truth: [Design v1.1](../Design-Aplikasi-Booking-Ruang-Meeting.md).

## Prasyarat visual

- Dev server: `http://localhost:3000`
- `GET /api/health` → `db: true`, `redis: true`
- Seed: **5 ruang** aktif (MR-A … MR-E)

## App shell (smoke)

- Header sticky: logo `BrandLogo`, brand *Ruang Meeting*, nav pill (Booking / Ruang / Booking saya).
- Font Geist (variabel di `<html>`); favicon `app/icon.svg`.

## Checklist layar (post-setup)

| Route | Verifikasi |
|-------|------------|
| `/book` | Room picker 5 kartu; tampilan **Hari** / **Minggu** / Daftar; jam 07–21 WIB |
| `/rooms` | Daftar ruang tanpa error "Permintaan gagal" |
| `/bookings` | List booking user (boleh kosong) |
| `/login` | Tampil saat `AUTH_MODE=oidc` |

## Auth mode dev

- `AUTH_MODE=dev` (default): banner dev user; `DEV_USER_ID` dari output `db:seed` di `.env.local`.
- Header opsional: `x-dev-user-id` / localStorage.

## Auth mode OIDC (staging-like)

- `AUTH_MODE=oidc`, `AUTH_SECRET` (≥32 char), `OIDC_*` terisi.
- Redirect URI IdP: `{NEXT_PUBLIC_APP_URL}/api/auth/callback/oidc`

## Tokens & tema

- CSS variables di `Apps/web/src/app/globals.css`
- Font Geist; dark mode mengikuti `prefers-color-scheme`

Kegagalan load data UI hampir selalu indikasi **environment/backend** — cek health dan DATABASE_URL sebelum debug desain.
