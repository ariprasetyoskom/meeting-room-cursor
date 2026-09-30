# GitHub Wiki — sumber halaman

Halaman wiki disimpan di folder ini, lalu di-push ke repo terpisah GitHub:

`https://github.com/ariprasetyoskom/meeting-room-cursor.wiki.git`

## Halaman

| File | Judul wiki |
|------|------------|
| `Home.md` | Home |
| `Getting-Started.md` | Getting-Started |
| `Product-and-Roadmap.md` | Product-and-Roadmap |
| `Troubleshooting.md` | Troubleshooting |
| `Documentation-Index.md` | Documentation-Index |
| `_Sidebar.md` | Sidebar (nav kiri) |

## Publish (pertama kali)

1. Buka [Wiki repo](https://github.com/ariprasetyoskom/meeting-room-cursor/wiki) → **Create the first page** (judul `Home`, isi bisa singkat `see repo`) — ini mengaktifkan git wiki.
2. Dari mesin dev (sudah login `gh auth login`):

```powershell
cd Devops\github-wiki
.\publish-wiki.ps1
```

Jika branch wiki memakai `main`:

```powershell
.\publish-wiki.ps1 -Branch main
```

3. Buka https://github.com/ariprasetyoskom/meeting-room-cursor/wiki

## Update berikutnya

Edit `.md` di folder ini → jalankan `publish-wiki.ps1` lagi.

**Jangan** commit folder `.git` lokal wiki ke monorepo (ada di `.gitignore`).
