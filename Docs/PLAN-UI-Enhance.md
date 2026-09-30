# Epic — UI enhance (MVP polish)

| Metadata | |
|----------|---|
| **Versi** | 1.0 |
| **Tanggal** | 30 September 2026 |
| **GitHub epic** | [#30 [UI-EPIC] UI enhance](https://github.com/ariprasetyoskom/meeting-room-cursor/issues/30) · sub-issue **#31–#40** · label `ui-enhance` · milestone **UI Enhance - MVP polish** |
| **Referensi** | [Design v1.1](./Design-Aplikasi-Booking-Ruang-Meeting.md) · PRD §6 UX |

## Goal

Polish visual dan UX tanpa ganti stack (CSS tokens + `globals.css`). Prioritas: **fondasi → `/book` → shell → layar lain → F-03 detail ruang**.

## Urutan implementasi

1. **UI-01 → UI-02** — tokens + kit `components/ui` ✅ (#31–#32 closed)
2. **UI-03** — app shell ✅ (#33 closed)
3. **UI-04 → UI-06** — `/book` (picker ✅ #34, kalender, modal)
4. **UI-07, UI-09** — `/rooms`, `/bookings`, detail ruang
5. **UI-08** — admin
6. **UI-10** — dark mode + a11y smoke

## CSV & script

- [plan-ui-enhance-issues.csv](./plan-ui-enhance-issues.csv)
- `node Devops/scripts/create-ui-enhance-github-issues.mjs` (sub-issue of epic)
- Kanban: [GITHUB-PROJECT.md](./GITHUB-PROJECT.md) — workflow UI + `node Devops/scripts/sync-project-status.mjs`

---

*Dokumen ringkas; detail visual: Design §4–§7.*
