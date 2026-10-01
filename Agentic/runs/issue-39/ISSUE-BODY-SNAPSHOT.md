Salin ke body GitHub issue #39 (automation token tidak punya scope `updateIssue`).

## Summary

Implementasi **UI-09** — halaman detail ruang F-03 (text-first) di `/rooms/[code]`.

**Perubahan**
- `GET /api/v1/rooms/[code]` — detail ruang aktif (auth employee+), kode case-insensitive.
- Halaman `Apps/web/src/app/rooms/[code]/page.tsx` + komponen `RoomDetail` (kapasitas, lantai, fasilitas, catatan OQ-3 foto optional).
- CTA **Pesan ruang** dan **Lihat kalender** → `/book?room=<id>`.
- `/rooms` — link judul & tombol **Detail**, **Pesan ruang**; amenities konsisten via `formatAmenities`.
- Helper `normalizeRoomCodeParam`, `roomDetailHref`; styling `.room-detail-*` di `globals.css`.

**File utama:** `RoomDetail.tsx`, `RoomDirectory.tsx`, `rooms.repository.ts`, `room-service.ts`, `room-display.ts`, API route `[code]/route.ts`.

**Smoke test (manual):** login dev → `/rooms` → **Detail** → verifikasi data & **Pesan ruang** ke kalender dengan room preselected.

**Commit:** `36e041e` on branch `agent/issue-39` (defer PR until Human QA).

## Test evidence

_(diisi pada stage test — `cd Apps/web && npm test`)_

## Audit

_(diisi pada stage audit)_

---

_(pertahankan blok UI enhance / acceptance / referensi asli di bawah section di atas)_
