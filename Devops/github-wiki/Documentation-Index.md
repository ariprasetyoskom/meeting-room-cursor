# Documentation Index

Dokumen lengkap di monorepo (`Docs/`):

| Dokumen | Link |
|---------|------|
| Indeks Docs | [Docs/README.md](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/README.md) |
| BRD v1.2 | [BRD](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/BRD-Aplikasi-Booking-Ruang-Meeting.md) |
| PRD v1.4 | [PRD](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/PRD-Aplikasi-Booking-Ruang-Meeting.md) |
| TDD v1.1 | [TDD](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/TDD-Aplikasi-Booking-Ruang-Meeting.md) |
| Architecture v1.3 | [Architecture](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/Architecture-Aplikasi-Booking-Ruang-Meeting.md) |
| Design v1.1 | [Design](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/Design-Aplikasi-Booking-Ruang-Meeting.md) |
| Release notes 0.1.0 | [RELEASE-NOTES](https://github.com/ariprasetyoskom/meeting-room-cursor/blob/cursor/meeting-room-web-scaffold/Docs/RELEASE-NOTES.md) |
| Platform setup | [000_platform_setup](https://github.com/ariprasetyoskom/meeting-room-cursor/tree/cursor/meeting-room-web-scaffold/Docs/000_platform_setup) |

## Memperbarui wiki ini

Sumber halaman wiki: `Devops/github-wiki/` di repo. Push ke GitHub Wiki:

```powershell
cd Devops\github-wiki
git init
git add *.md
git commit -m "Update wiki pages"
git remote add origin https://github.com/ariprasetyoskom/meeting-room-cursor.wiki.git
git push -u origin master
```

(Gunakan branch `main` jika remote wiki sudah memakai `main`.)
