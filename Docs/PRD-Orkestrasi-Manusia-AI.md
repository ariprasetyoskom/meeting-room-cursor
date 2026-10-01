# Product Requirements Document (PRD)
# Orkestrasi Manusia dan AI

| Metadata | |
|----------|---|
| **Dokumen** | PRD-Orkestrasi-Manusia-AI |
| **Identitas PRD** | **ORCH** |
| **Versi** | **1.4** |
| **Tanggal** | 1 Oktober 2026 |
| **Status** | Draft — siap ditinjau Product |
| **Pemohon** | Sayan |
| **Bahasa** | Indonesia |
| **Dokumen Terkait** | [Architecture Development Orchestration](./Architecture-Development-Orchestration.md) · [PRD KAD](./PRD-Kanban-Agent-Dispatch.md) · [PRD fase platform (contoh input)](./000_platform_setup/PRD_platform_setup_development_phase.md) · [PRD platform](./000_platform_setup/PRD-Platform-Environment-Setup.md) · [Agentic](../Agentic/README.md) · [Development](../Development/README.md) |

---

## 1. Ringkasan Produk

ORCH adalah runner development yang mengeksekusi **satu task** dari dokumen fase PRD melalui tiga stage terpisah: **develop**, **test**, dan **audit**. Isi stage dikerjakan pelaksana: **agent AI atau manusia**. Keduanya menerima daftar acuan yang sama dan menulis **dua** berkas terpisah: dokumen agent (rencana dan verdict) serta dokumen development (hasil dan bukti). Transisi antar stage dipegang orchestrator deterministik.

Antar stage hanya ada tiga keputusan: lanjut ke pelaksana berikutnya (`pass`), ulang stage yang sama (`fail`), atau berhenti untuk klarifikasi (`clarify`). Pelaksana tidak membuka stage berikutnya dan tidak mengubah kebijakan gate. Klarifikasi adalah jawaban atas pertanyaan, bukan pengganti pekerjaan stage.

PRD produk (apa yang dibangun) dan dokumen fase (task, verifikasi, gate keluar) tetap menjadi sumber kebenaran scope. ORCH tidak mengganti keduanya. ORCH memastikan tiap task dijalankan, diverifikasi, dan diaudit dengan bukti, serta manusia tetap memegang keputusan yang tidak boleh diambil agent.

**MVP v0.1** mengunci bidang kontrol: parser, mesin state, packet, dokumen agent, dokumen development, inbox, gate fase, dan klaim stage oleh manusia — plus satu pilot develop. **v1.0** menyambungkan test dan audit sebagai run terpisah, masing-masing dengan kedua dokumen itu, dan mengaktifkan kebijakan lanjut otomatis pada kanonik yang verifikasinya berupa perintah.

---

## 2. Persona

| Persona | Kebutuhan |
|---------|-----------|
| **Product Owner** | Memasok PRD induk dan dokumen fase; menyetujui gate keluar fase; menjawab klarifikasi produk |
| **Operator** | Menjalankan runner, melihat task yang berhenti, mencatat jawaban manusia, melanjutkan stage yang sama |
| **Pelaksana develop** | Manusia atau agent AI. Mengubah kode pada branch task agar aktivitas task terpenuhi, lalu menyerahkan packet |
| **Pelaksana test** | Manusia atau agent AI. Menjalankan verifikasi task dan melaporkan bukti lulus atau gagal |
| **Pelaksana audit** | Manusia atau agent AI yang **bukan** pelaksana develop task yang sama. Menilai diff dan log terhadap kontrak task |

---

## 3. Keputusan Produk (Locked)

| ID | Keputusan | Implikasi |
|----|-----------|-----------|
| **OR-01** | Transisi stage dimiliki orchestrator deterministik. | Prompt agent tidak berisi instruksi “lanjut ke stage berikut”. |
| **OR-02** | Satu task = tiga run terpisah: develop, test, audit. | Bukan satu percakapan panjang yang merangkap tiga peran. |
| **OR-03** | Yang berpindah antar stage adalah handoff packet, bukan transkrip obrolan. | Stage berikutnya tidak mulai jika packet stage saat ini belum lengkap. |
| **OR-04** | Verdict gate hanya `pass`, `fail`, atau `clarify`. | Tidak ada status samar (“hampir selesai”, “lanjut dengan catatan”). |
| **OR-05** | `fail` mengulang stage yang sama. Maksimal **2** ulang, lalu paksa `clarify`. | Percobaan ke-3 yang gagal tidak boleh diserahkan lagi ke agent tanpa manusia. |
| **OR-06** | `clarify` menghentikan task itu. Setelah jawaban manusia tercatat, **stage yang sama** dijalankan ulang. | Jawaban tidak melewatkan stage yang bertanya. |
| **OR-07** | Audit tidak menerima transkrip develop. | Acuan audit hanya ref PRD, pasangan dokumen develop, pasangan dokumen test, diff, dan log. |
| **OR-08** | Kebijakan agent-ke-agent atau agent-ke-manusia ditulis di manifest **sebelum** run. | Agent tidak memilih kebijakan saat runtime. |
| **OR-09** | Gate keluar fase selalu manusia, walaupun semua task fase itu `pass`. | Selaras “Gate keluar” pada dokumen fase. |
| **OR-10** | Kanonik **auth**, **worker**, **ci**, **ops**: gate sesudah audit selalu manusia. Kanonik **stack**, **infra**, **be**, **fe**: boleh agent-ke-agent bila verifikasi deterministik lulus dan audit `pass`. | Efek samping auth, antrian, pipeline, dan deploy tidak ditutup sendiri oleh agent. |
| **OR-11** | Keputusan produk (port, auth mode, scope, nilai default) selalu `clarify`. | Tidak ada default diam-diam pada pilihan produk. |
| **OR-12** | Pada satu workspace, satu task aktif. Kerja stage berada di branch `agent/{taskId}`. Runtime agent AI pada v1.0 adalah lokal. | Operator dapat menghentikan, meninjau diff, dan menjawab tanpa dua task saling menimpa. |
| **OR-13** | Setiap stage punya pelaksana `ai` atau `human`, ditetapkan sebelum pekerjaan stage dimulai. Keduanya mengembalikan packet §7. | Manusia dapat mengerjakan develop, test, atau audit. Orchestrator tidak memanggil agent AI pada stage yang sudah diklaim manusia. |
| **OR-14** | Pelaksana audit sebuah task tidak boleh identitas yang sama dengan pelaksana develop task itu. | Orang yang mengerjakan develop tidak menyerahkan packet audit. Bila develop dikerjakan manusia dan tidak ada pelaksana audit lain, audit diisi agent AI, atau sebaliknya. |
| **OR-15** | Setiap stage menulis dua dokumen terpisah: dokumen agent dan dokumen development. | Dokumen agent selesai (Acuan, Yang akan dilakukan, Verdict) sebelum ada perubahan kode. Dokumen development hanya memuat hasil dan bukti, tanpa verdict. |
| **OR-16** | Acuan tiap stage tetap, sesuai §4.4. Acuan di luar daftar membutuhkan `clarify`. | Stage berikutnya membaca dokumen agent dan dokumen development stage sebelumnya. Transkrip obrolan bukan acuan. |

---

## 4. Alur Kerja

### 4.1 State per task

```text
queued
  → develop → gate
  → test    → gate
  → audit   → gate
  → done
```

Dari setiap gate:

- `pass` — orchestrator membuka stage berikutnya, atau `done` bila stage itu audit dan kebijakan kanonik mengizinkan tutup otomatis.
- `fail` — kembali ke stage yang sama dengan bukti kegagalan di packet. Setelah 2 ulang, verdict menjadi `clarify`.
- `clarify` — state `waiting_human`. Task lain di fase yang sama tidak dimulai (OR-12).

Fase baru tidak dimulai sebelum gate keluar fase disetujui manusia (OR-09).

### 4.2 Tiga lapis pemeriksaan

Sebuah `pass` hanya sah jika lapis yang berlaku untuk stage itu terpenuhi. Orchestrator yang menggabungkan hasilnya, bukan agent.

| Lapis | Pemilik | Kapan |
|-------|---------|-------|
| **Deterministik** | Perintah di kolom Output / verifikasi dokumen fase | Wajib bila sel itu berupa perintah yang bisa dijalankan (exit 0) |
| **Kontrak packet** | Orchestrator | Setiap transisi: field wajib terisi, path perubahan masih di scope task |
| **Audit** | Pelaksana audit, terpisah dari develop (OR-14) | Setelah test `pass`; verdict audit tetap `pass` / `fail` / `clarify` |
| **Manusia** | Product Owner atau Operator | `clarify`, kanonik OR-10, dan gate keluar fase |

Jika verifikasi task tidak bisa dijadikan perintah, lapis deterministik tidak dianggap lulus. Task itu berhenti di `clarify` supaya manusia menuliskan bukti yang diterima.

### 4.3 Input yang dikonsumsi

ORCH membaca dokumen fase yang sudah berbentuk tabel task, dengan kolom minimal:

| Kolom | Dipakai untuk |
|-------|----------------|
| Task ID | Identitas run, branch, folder ledger. Pola `{xxxx}{yy}-{kanonik}-task` |
| Ref PRD | Jejak ke persyaratan induk; tidak dieksekusi sebagai perintah |
| Detail aktivitas | Kontrak kerja agent develop |
| Output / verifikasi | Kontrak lulus; perintah di sini menjadi lapis deterministik |
| Gate keluar (per fase) | Persetujuan manusia sebelum fase berikutnya |

Contoh input yang sah: [PRD_platform_setup_development_phase.md](./000_platform_setup/PRD_platform_setup_development_phase.md) (task `PSET{yy}-{kanonik}-task`, Fase 0–9).

### 4.4 Acuan, dokumen agent, dan dokumen development

Setiap stage mulai dari daftar acuan tetap dan menulis dua berkas. Packet menunjuk keduanya. Stage berikutnya membaca kedua berkas itu, bukan transkrip.

Dokumen produk (`Docs/`: PRD, fase, TDD) tetap acuan development. Run agent tidak ditulis ke `Docs/`.

**Acuan wajib**

| Stage | Dibaca sebelum menulis dokumen agent |
|-------|--------------------------------------|
| **develop** | PRD induk pada kolom Ref PRD; baris task di dokumen fase; dokumen agent dan dokumen development attempt develop sebelumnya bila attempt > 1 |
| **test** | Dokumen agent develop dan dokumen development develop attempt terakhir; kolom Output / verifikasi; diff branch task |
| **audit** | Ref PRD task; pasangan dokumen develop (agent + development); pasangan dokumen test; diff dan log yang disebut di dokumen development test |

Transkrip develop bukan acuan audit (OR-07).

**Dokumen agent** — rencana dan keputusan stage

Path: `Agentic/runs/{taskId}/agent/{attempt}-{stage}.md`

| Bagian | Isi | Kapan diisi |
|--------|-----|-------------|
| **Acuan** | Path dan bagian yang dipakai | Sebelum kerja |
| **Yang akan dilakukan** | Langkah terurut | Sebelum langkah itu dijalankan |
| **Di luar scope** | Yang sengaja tidak dikerjakan | Bersama rencana |
| **Verdict** | `pass`, `fail`, atau `clarify`; bila `clarify`, satu pertanyaan | Saat menyerahkan |

**Dokumen development** — hasil kerja

Path: `Agentic/runs/{taskId}/development/{attempt}-{stage}.md`

| Bagian | Isi | Kapan diisi |
|--------|-----|-------------|
| **Tautan** | Path dokumen agent stage yang sama | Bersama hasil |
| **Yang dihasilkan** | Apa yang sudah terjadi pada kode atau lingkungan | Setelah langkah dijalankan |
| **Bukti** | Perintah, exit code, file yang berubah | Setelah langkah dijalankan |

Dokumen development tidak memuat **Verdict**. Dokumen agent tidak memuat perintah, exit code, atau daftar file berubah.

Gate menolak packet jika bagian dokumen agent kosong. Verdict `pass` juga ditolak jika dokumen development tidak ada. Verdict `clarify` sebelum ada perubahan boleh tanpa dokumen development.

### 4.5 Papan kanban admin (visual) vs mesin ORCH

Operator melihat delapan kolom di `/admin/board` (**Intake → Plan → Development → Test → Audit → Human Clarify → Human QA → Done**). Kolom ini **mirror** alur produk; mesin ORCH §4.1 tetap tiga stage (`develop`, `test`, `audit`) plus gate.

| Kolom kanban | Stage / state ORCH | Pelaksana v1.0 |
|--------------|-------------------|----------------|
| Intake, Plan | Pra-`develop` (antrean & rencana) | Manusia geser kartu |
| **Development** | `develop` | **KAD**: geser ke kolom ini memicu agent via webhook ([PRD KAD](./PRD-Kanban-Agent-Dispatch.md)) |
| Test | `test` | Manusia geser; runner ORCH menyusul |
| Audit | `audit` | Manusia geser; runner ORCH menyusul |
| Human Clarify | `waiting_human` (`clarify`) | Manusia jawab inbox; kartu di kolom ini |
| Human QA | Gate penerimaan manusia pasca-audit | Manusia |
| Done | `done` | Manusia |

Runner ORCH **memegang** transisi gate (`pass` / `fail` / `clarify`). Kanban v1.0 tidak mengganti orchestrator; hanya **Development** terhubung dispatch. Dokumen stage tetap di `Agentic/runs/{taskId}/` (§4.4).

**Log operasional** (dispatch, lock, event runner) terpusat di `Development/logs/` — bukan dokumen agent/development. Detail: [Architecture Development Orchestration §6](./Architecture-Development-Orchestration.md).

---

## 5. Fitur

| ID | Fitur | Deskripsi | Rilis |
|----|-------|-----------|-------|
| **F-01** | Parser dokumen fase | Mengurai tabel task menjadi daftar terurut: task id, fase, kanonik, aktivitas, verifikasi | v0.1 |
| **F-02** | Manifest kebijakan | Menetapkan `auto` atau `human` per kanonik sesuai OR-10, plus batas ulang OR-05 | v0.1 |
| **F-03** | Mesin state | Menjalankan state §4.1; menolak loncat stage dan menolak dua task aktif | v0.1 |
| **F-04** | Handoff packet | Menyimpan bukti dan verdict tiap stage sebelum transisi (§7) | v0.1 |
| **F-05** | Inbox klarifikasi | Menampilkan task `waiting_human` dan mencatat jawaban ke packet (§8) | v0.1 |
| **F-06** | Gate keluar fase | Meminta persetujuan manusia saat semua task fase `done`; tanpa persetujuan, fase berikutnya tetap tertutup | v0.1 |
| **F-07** | Ledger run | Menyimpan task, stage, attempt, verdict, identitas run agent, dan path packet. Event operasional ORCH/KAD append ke `Development/logs/` (selaras KAD-09) | v0.1 |
| **F-08** | Pilot develop | Satu task kanonik **be** atau **fe** dikerjakan agent develop pada branch task | v0.1 |
| **F-09** | Gate perintah | Exit code verifikasi menentukan lapis deterministik, tanpa penilaian model | v0.1 |
| **F-10** | Stage test | Run test terpisah; inputnya packet develop plus kontrak verifikasi | v1.0 |
| **F-11** | Stage audit | Run audit terpisah dengan batas input OR-07 | v1.0 |
| **F-12** | Lanjut setelah jawaban | Jawaban inbox melanjutkan run stage yang menunggu, lalu stage itu diulang | v1.0 |
| **F-13** | Batas ulang | Attempt ke-3 yang gagal menjadi `clarify` tanpa dipanggil ulang ke agent | v1.0 |
| **F-14** | Branch per task | Diff stage berada di `agent/{taskId}` dan disebut di packet | v1.0 |
| **F-15** | Peran tetap | Tiga instruksi peran (develop, test, audit). Tiap peran hanya mengisi packet stage-nya | v1.0 |
| **F-16** | Inbox web | Halaman untuk menjawab klarifikasi di luar file lokal | Berikutnya |
| **F-17** | Task paralel | Lebih dari satu task aktif dalam fase yang sama | Berikutnya |
| **F-18** | Runtime cloud | Agent berjalan di mesin terpisah dari workspace operator | Berikutnya |
| **F-19** | Ambil stage | Operator mengklaim stage yang baru dibuka sebagai pelaksana `human`. Orchestrator menunggu packet, tidak memanggil agent AI | v0.1 |
| **F-20** | Dua dokumen stage | Menulis dokumen agent dan dokumen development di `Agentic/runs/{taskId}/` sesuai §4.4. Gate menolak bila rencana dan hasil bercampur dalam satu berkas | v0.1 |

---

## 6. Kebijakan Handoff

Manifest bawaan. Perubahan kebijakan adalah perubahan produk (versi PRD ini), bukan pilihan agent di tengah run.

| Kanonik | Develop → test | Test → audit | Audit → task `done` |
|---------|----------------|--------------|---------------------|
| **stack**, **infra**, **be**, **fe** | `auto` jika perintah verifikasi exit 0 dan packet lengkap | `auto` jika test `pass` | `auto` jika audit `pass` |
| **auth**, **worker**, **ci**, **ops** | `auto` jika perintah verifikasi exit 0 dan packet lengkap | `auto` jika test `pass` | **selalu manusia** |

Gate keluar **fase** tidak ada di tabel ini. Ia selalu manusia (OR-09), untuk semua kanonik.

Jika agent atau perintah verifikasi menemukan pilihan produk yang belum terkunci di PRD induk, verdict stage itu `clarify` (OR-11), meskipun baris kanonik di atas bertanda `auto`.

---

## 7. Kontrak Handoff Packet

Satu file per stage yang selesai atau berhenti. Lokasi packet/ledger runner bersifat lokal pada run dan **tidak di-commit** (rencana: subfolder di bawah `Development/` selain `logs/` atau `Development/ledger/orch/` — TDD ORCH). **Log event** (bukan packet) append ke `Development/logs/*.jsonl` ([Architecture §6](./Architecture-Development-Orchestration.md)).

Field wajib:

| Field | Isi |
|-------|-----|
| `taskId` | ID task dokumen fase |
| `stage` | `develop`, `test`, atau `audit` |
| `attempt` | 1–3 |
| `verdict` | `pass`, `fail`, atau `clarify` |
| `evidence` | Perintah, exit code, cuplikan log, daftar file yang berubah |
| `question` | Wajib jika `clarify`: satu pertanyaan |
| `options` | Wajib jika `clarify` dan jawabannya berupa pilihan |
| `answer` | Kosong sampai manusia mengisi; setelah terisi, stage yang sama boleh diulang |
| `executor` | `ai` atau `human` |
| `executorId` | Identitas run agent, atau nama pelaksana manusia. Dipakai OR-14 |
| `agentDocPath` | Path dokumen agent §4.4 |
| `developmentDocPath` | Path dokumen development §4.4; kosong hanya bila `clarify` sebelum ada perubahan |

Packet tidak boleh memuat isi `.env`, token, atau secret. Bila bukti hanya bisa dijelaskan dengan secret, verdict `clarify` dan secret tetap di luar ledger.

---

## 8. Klarifikasi Manusia

Inbox v0.1 dan v1.0 adalah satu berkas lokal per PRD yang sedang dijalankan, berisi hanya task berstatus `waiting_human`.

Tiap entri menampilkan:

- task id dan stage yang berhenti
- pertanyaan tunggal
- opsi, bila ada
- attempt yang sudah terpakai

Operator atau Product Owner menulis **satu jawaban**. Orchestrator menyalin jawaban ke field `answer` packet, lalu mengulang stage yang sama (OR-06). Tidak ada jawaban yang sekaligus menutup stage.

Penolakan manusia pada gate audit kanonik sensitif atau pada gate keluar fase mengembalikan task ke `develop` dengan alasan di packet, dan attempt ulang dihitung dari OR-05.

### 8.1 Manusia sebagai pelaksana stage

Peran ini berbeda dari klarifikasi. Pelaksana mengerjakan stage dan mengisi packet. Pengklarifikasi hanya menjawab pertanyaan.

Saat orchestrator membuka stage, operator dapat mengambilnya (F-19) sebelum agent AI dipanggil. Orchestrator menampilkan kontrak task, packet masuk, dan batas peran:

| Stage | Yang dikerjakan pelaksana | Yang tidak boleh |
|-------|---------------------------|------------------|
| **develop** | Menulis dokumen agent, lalu perubahan sesuai Yang akan dilakukan, lalu dokumen development | Menjalankan audit atas pekerjaannya sendiri; membuka stage test; menulis verdict di dokumen development |
| **test** | Menulis dokumen agent dari acuan develop, menjalankan verifikasi, lalu dokumen development | Mengubah scope di luar perbaikan yang diminta dokumen agent `fail` |
| **audit** | Menulis dokumen agent dan dokumen development dari acuan §4.4 | Membaca transkrip develop; mengaudit task yang develop-nya ia kerjakan sendiri (OR-14) |

Stage selesai ketika packet lengkap masuk. Lapis deterministik dan kontrak packet tetap diperiksa orchestrator. Verdict `pass` dari pelaksana manusia tidak membuka stage berikutnya bila perintah verifikasi gagal.

---

## 9. Out of Scope

Untuk v0.1 dan v1.0:

- Agent menulis atau mengubah manifest kebijakan gate
- Satu run agent yang merangkap develop, test, dan audit
- Melewatkan stage karena jawaban klarifikasi
- Merge otomatis branch task ke `main`
- Lebih dari satu task aktif pada workspace yang sama
- Inbox web (F-16), task paralel (F-17), runtime cloud (F-18)
- Mengganti atau menafsir ulang scope PRD induk di luar teks task
- Pelaksana develop yang juga menjadi pelaksana audit pada task yang sama (OR-14)

---

## 10. UX Operator

Bahasa inbox dan status: **Indonesia**. Istilah stage (`develop`, `test`, `audit`, `pass`, `fail`, `clarify`) tetap dalam bentuk itu supaya selaras dengan ledger.

Perintah yang harus ada:

| Perintah | Hasil |
|----------|--------|
| Muat dokumen fase | Daftar task terurai; task yang kolomnya rusak ditolak sebelum run |
| Status | Stage, attempt, dan verdict task aktif; daftar yang `waiting_human` |
| Jawab | Menulis jawaban ke packet task yang berhenti |
| Setujui fase | Mencatat persetujuan gate keluar; menolak jika masih ada task belum `done` |
| Berhenti | Menghentikan run agent yang sedang jalan tanpa membuka stage berikutnya |
| Ambil | Mengklaim stage yang baru dibuka sebagai pelaksana manusia (F-19) |
| Serahkan | Menulis packet stage yang diklaim; ditolak jika field wajib kosong atau OR-14 dilanggar |

Status yang dilihat operator selalu berasal dari ledger, bukan dari kalimat terakhir agent.

---

## 11. Non-Functional

| ID | Syarat |
|----|--------|
| **NFR-01** | Keputusan transisi stage tidak memanggil model. Model hanya mengisi pekerjaan di dalam stage. |
| **NFR-02** | Input audit tidak menyertakan transkrip develop (OR-07). |
| **NFR-03** | Ledger dan packet tidak menyimpan secret. |
| **NFR-04** | Kegagalan menjalankan agent (tidak mulai) tercatat terpisah dari verdict `fail` (run mulai lalu gagal). Keduanya tidak membuka stage berikutnya. |
| **NFR-05** | Packet stage tertulis tuntas sebelum stage berikutnya dimulai. |

---

## 12. Metrik Sukses

| Metrik | Target v1.0 |
|--------|-------------|
| Transisi stage tanpa packet lengkap | **0** |
| Stage yang dibuka oleh agent, bukan orchestrator | **0** |
| Gate keluar fase yang terlewat | **0** |
| Task kanonik auth/worker/ci/ops yang `done` tanpa catatan manusia | **0** |
| Klarifikasi yang melewatkan stage peminta | **0** |
| Pilot | Satu task `PSET` kanonik be atau fe selesai sampai `done` dengan tiga packet dan bukti perintah verifikasi |
| Audit oleh pelaksana develop yang sama | **0** |

---

## 13. Dependencies

| Dependensi | Untuk |
|------------|--------|
| Dokumen fase sah (§4.3) | F-01 |
| Repo git pada mesin operator | F-14 |
| Cursor SDK, runtime **lokal**, kunci API operator | F-08, F-10, F-11, F-12 |
| Perintah verifikasi yang bisa dijalankan di workspace | F-09 pada task `auto` |

Detail pemanggilan SDK, schema file, dan layout folder runner ditulis di TDD ORCH, bukan di PRD ini.

---

## 14. Open Questions

| ID | Pertanyaan | Status |
|----|------------|--------|
| **OQ-1** | Apakah penolakan pada gate keluar fase mengulang seluruh task fase, atau hanya task yang disebut di alasan? | **Open** — default implementasi v0.1: hanya task yang disebut; task lain tetap `done` |
| **OQ-2** | Apakah kanonik di luar daftar §6 (jika dokumen fase menambah kanonik baru) gagal saat parser, atau masuk antrean manusia? | **Open** — usulan: parser menolak sampai manifest ditambah di versi PRD ini |
| **OQ-3** | Model yang dipakai develop vs audit | **Open** — tidak mengunci ID model di PRD; audit harus run terpisah dari develop |

Hanya OQ-1–OQ-3 yang terbuka. OR-01–OR-16 sudah terkunci untuk versi ini.

---

## 15. Kriteria Rilis

### v0.1 — bidang kontrol

- F-01–F-07, F-09, F-19, dan F-20 lulus pada dokumen fase platform: task terurai, state tidak bisa meloncat, packet wajib, inbox `clarify` menghentikan task, gate fase tidak terbuka tanpa persetujuan.
- F-20: dokumen agent develop pilot memuat **Acuan** dan **Yang akan dilakukan** sebelum ada perubahan kode. Dokumen development terpisah dan tidak memuat verdict. Gate menolak packet tanpa `agentDocPath`.
- F-19: satu stage develop diklaim manusia, packet `executor=human` diterima, stage test tidak terbuka sebelum orchestrator menilai gate.
- F-08: satu task pilot develop menghasilkan branch `agent/{taskId}` dan packet develop. Pilot ini boleh pelaksana manusia (F-19) atau agent AI.
- Tidak ada stage test atau audit sungguhan yang diwajibkan pada v0.1 (boleh stage palsu yang hanya menjalankan perintah verifikasi).

### v1.0 — tiga stage hidup

- F-10–F-15 lulus pada task pilot yang sama.
- Audit tidak memuat transkrip develop di input run-nya (NFR-02).
- Dua gagal berturut-turut pada stage yang sama berakhir `clarify` (OR-05).
- Jawaban inbox mengulang stage peminta (OR-06).
- Task **auth** tidak menjadi `done` tanpa tindakan manusia (OR-10).
- Packet audit ditolak bila `executorId` sama dengan pelaksana develop task itu (OR-14).
- Dokumen agent test menyebut dokumen agent develop dan dokumen development develop sebagai acuan. Dokumen agent audit menyebut pasangan develop dan test, dan tidak menyebut transkrip develop.
- Metrik §12 terpenuhi pada pilot.

---

## 16. Glosarium

| Istilah | Arti di dokumen ini |
|---------|---------------------|
| **Orchestrator** | Program deterministik yang menyimpan state dan membuka stage. Bukan agent. |
| **Stage** | Satu dari develop, test, audit. Satu pelaksana, manusia atau agent AI. |
| **Pelaksana** | Pihak yang mengerjakan isi stage dan mengisi packet. Bukan pemilik gate. |
| **Gate** | Titik keputusan sesudah stage. Hanya `pass`, `fail`, `clarify`. |
| **Handoff packet** | Catatan mesin satu stage, termasuk path dokumen agent dan dokumen development. |
| **Dokumen agent** | Rencana stage: acuan, yang akan dilakukan, di luar scope, verdict. |
| **Dokumen development** | Hasil stage: tautan ke dokumen agent, yang dihasilkan, bukti. Tanpa verdict. |
| **Acuan** | Dokumen yang wajib dibaca pelaksana sebelum mengisi Yang akan dilakukan. Daftarnya tetap per stage (§4.4). |
| **Kanonik** | Segmen domain pada task id (`stack`, `be`, `auth`, …). Menentukan kebijakan §6. |
| **Gate keluar fase** | Persetujuan manusia setelah seluruh task dalam satu fase `done`. |
| **Ledger** | Catatan lokal run (packet + state orchestrator). Bukan bagian dari PRD induk dan tidak di-commit. |
| **Log terpusat** | `Development/logs/` — event operasional (KAD, nanti ORCH). Terpisah dari dokumen `Agentic/runs/`. |
| **KAD** | Dispatch kanban kolom Development → Cursor Automation. Bukan mesin gate ORCH. |

---

## 17. Dokumen Terkait

| Dokumen | Path | Peran terhadap ORCH |
|---------|------|---------------------|
| Contoh dokumen fase | [000_platform_setup/PRD_platform_setup_development_phase.md](./000_platform_setup/PRD_platform_setup_development_phase.md) | Input parser |
| PRD platform | [000_platform_setup/PRD-Platform-Environment-Setup.md](./000_platform_setup/PRD-Platform-Environment-Setup.md) | PRD induk contoh |
| PRD produk booking | [PRD-Aplikasi-Booking-Ruang-Meeting.md](./PRD-Aplikasi-Booking-Ruang-Meeting.md) | Bukan objek ORCH; scope produk tetap di sana |
| Skill agen dokumen | [Agentic/README.md](../Agentic/README.md) | Pola instruksi peran; bukan mesin gate |
| Kanban dispatch | [PRD-Kanban-Agent-Dispatch.md](./PRD-Kanban-Agent-Dispatch.md) | Trigger develop via kolom Development |
| Arsitektur | [Architecture-Development-Orchestration.md](./Architecture-Development-Orchestration.md) | C4, log, pemetaan kanban |

TDD ORCH (schema ledger, pemanggilan SDK, layout runner) menyusul setelah PRD ini disetujui.

---

*Akhir PRD Orkestrasi Manusia dan AI v1.4.*
