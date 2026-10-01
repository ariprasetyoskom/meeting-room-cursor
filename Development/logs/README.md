# Log terpusat (Development)

Semua channel menulis ke folder ini sebagai `*.jsonl` (satu JSON per baris).

| File | Channel | Contoh event |
|------|---------|----------------|
| `kad-dispatch.jsonl` | `kad-dispatch` | `dispatch.accepted`, `dispatch.webhook_failed`, `lock.cleared` |
| `kad-dispatch-ledger.json` | — | State lock aktif (bukan append log) |

Baca tail lokal (PowerShell):

```powershell
Get-Content .\Development\logs\kad-dispatch.jsonl -Tail 20
```
