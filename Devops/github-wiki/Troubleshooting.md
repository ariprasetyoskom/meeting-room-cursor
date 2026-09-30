# Troubleshooting

## "Permintaan timeout" di UI

- Client timeout **20 detik** (`apiFetch`).
- Cek `npm run dev` jalan dan http://127.0.0.1:3000/api/health respons cepat.
- Cek Postgres: `docker compose restart postgres` lalu `npx tsx scripts/check-db.mts` di `Apps/web`.
- Pastikan tidak ada proses lain di port **5434**.

## "Permintaan gagal" saat konfirmasi booking

- Sering berarti **HTTP 500** tanpa JSON (bukan bentrok 409).
- **Penyebab umum:** enqueue email ke Redis gagal setelah booking tersimpan — diperbaiki di commit `b2ef14c` (enqueue tidak throw).
- Cek **Booking saya** — booking mungkin sudah tercreate meski UI error.
- Pastikan pull branch terbaru.

## `/api/health` → `redis: false`

- Container Redis healthy, tapi Node di Windows kadang `ECONNABORTED`.
- Coba `REDIS_URL=redis://127.0.0.1:6379` (bukan `localhost`).
- Booking tetap jalan; email/worker butuh Redis — lihat issue Wave 1 (#1–#2).

## MissingSecret / middleware auth

- Set `AUTH_SECRET` di `.env.local` (dev fallback ada di middleware, prod/staging wajib).

## CI build

- Baseline hijau post-fix: commit `a00a735` (health force-dynamic, Redis lazy).

## Lapor bug

Buat issue di GitHub dengan: langkah repro, screenshot Network tab, output health + `check-db`.
