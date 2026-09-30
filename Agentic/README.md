# Agentic — Skills & Templates Dokumen

Skill Cursor untuk menghasilkan dokumen selaras repo ini. Setiap folder berisi `SKILL.md` dan satu atau lebih template `{{...}}`.

| Skill | Output default | Referensi emas |
|-------|----------------|----------------|
| [brd-booking-meeting](./brd-booking-meeting/) | `Docs/BRD-*.md` | `Docs/BRD-Aplikasi-Booking-Ruang-Meeting.md` |
| [platform-arsitektur](./platform-arsitektur/) | `Docs/000_platform_setup/arsitektur.md` | `Docs/000_platform_setup/arsitektur.md` |
| [platform-design](./platform-design/) | `Docs/000_platform_setup/design.md` | `Docs/000_platform_setup/design.md` |
| [platform-techstack](./platform-techstack/) | `Docs/000_platform_setup/techstack.md` | `Docs/000_platform_setup/techstack.md` |
| [devops-agent](./devops-agent/) | `Agentic/runs/{taskId}/agent/` dan `.../development/` | [PRD ORCH §4.4](../Docs/PRD-Orkestrasi-Manusia-AI.md) |

Salinan untuk Cursor IDE: [.cursor/skills/](../.cursor/skills/) (struktur identik).

**Cara pakai:** sebut skill di chat (mis. *"pakai skill brd-booking-meeting"*) atau minta agent memuat `SKILL.md` lalu isi template.
