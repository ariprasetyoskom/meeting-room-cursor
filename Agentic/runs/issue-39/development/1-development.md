# Development — issue-39 (UI-09)

| Field | Isi |
|-------|-----|
| Ticket | UI-09 — `/rooms/[code]` F-03 text-first |
| Stage | development |

## Perubahan

- Halaman `/rooms/[code]` dengan kapasitas, lantai, fasilitas, CTA **Pesan ruang** → `/book?room=<id>`.
- API `GET /api/v1/rooms/[code]` (ruang aktif, auth employee+).
- Daftar `/rooms`: link detail + CTA pesan; amenities via `formatAmenities`.
- Foto ruang (OQ-3) tidak diimplementasi — catatan teks di detail.

## Smoke test (manual)

1. Login dev user, buka `/rooms`, klik **Detail** atau judul ruang.
2. Verifikasi `/rooms/MR-A` (atau kode seed) menampilkan kapasitas & fasilitas.
3. **Pesan ruang** membuka `/book?room=<uuid>`.

## Bukti otomatis

`cd Apps/web && npm test` — exit 0 (64 tests).
