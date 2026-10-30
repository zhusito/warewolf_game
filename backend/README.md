# Backend Game Werewolf MBTI

Server Node.js untuk room multiplayer, state game, aturan role, chat, dan timer fase. Room dan seluruh state disimpan di memori proses; semuanya hilang saat server restart.

## Stack dan scripts

- Node.js, Express, Socket.IO, dan CORS
- `npm start` — jalankan server
- `npm run dev` — jalankan dengan `node --watch`
- `npm run test:sim` — jalankan simulasi 20 pemain (server harus sudah berjalan)

Gunakan Node.js 20.19+ atau 22.12+ agar sesuai dengan toolchain Vite frontend.

## Menjalankan lokal

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm start
```

Server menggunakan `http://localhost:3001` secara default. Health check tersedia di `http://localhost:3001/health` dan mengembalikan `{ "ok": true }`.

Environment pada `backend/.env`:

```env
PORT=3001
CLIENT_ORIGIN=*
```

- `PORT` — port HTTP dan Socket.IO (default `3001`).
- `CLIENT_ORIGIN` — origin yang diizinkan oleh CORS. Untuk deployment, isi dengan origin frontend yang digunakan.

## Aturan game

- Kode room terdiri dari enam karakter. Kapasitas room 30 pemain; game dapat dimulai jika setidaknya 7 pemain siap.
- Hanya host yang dapat memulai game atau kick pemain. Pemain yang belum siap ditinggalkan dari room ketika host memulai.
- Durasi fase normal: Malam 45 detik, Diskusi 60 detik, Voting 30 detik, Elimination 8 detik. Fase voting dapat selesai lebih awal setelah semua pemain hidup memilih. Jika suara tertinggi seri, tidak ada pemain yang dieliminasi.
- Dengan `FAST_PHASES=1`, fase menjadi 4/3/3/2 detik (Malam/Diskusi/Voting/Elimination).
- Pemain yang terputus di lobby dihapus setelah grace period 20 detik jika belum kembali. Pemain yang terputus saat game tidak langsung dihapus dan dapat rejoin dengan sesi yang sama.
- Siang hari, pemain hidup dapat memakai chat umum. Saat malam, tim Werewolf/Vampire memiliki chat rahasia bersama. Pemain mati hanya dapat chat dengan pemain mati lainnya.
- Role diacak berdasarkan jumlah pemain. Role yang mungkin: Werewolf, Alpha Werewolf, Vampire, Cursed, Lycan, Strong Villager, Guardian, Seer, Witch, Hunter, Cupid, King, Troublemaker, Thief, dan Villager.
- Vampire menang jika masih ada Vampire dan jumlah Vampire hidup setidaknya sama dengan semua pemain hidup non-Vampire. Werewolf menang jika jumlah Werewolf hidup setidaknya sama dengan gabungan tim lain. Villager menang jika Werewolf dan Vampire habis. Lovers menang jika menjadi dua pemain terakhir.

## Simulasi game

Di terminal pertama, jalankan server dengan fase cepat:

```powershell
$env:FAST_PHASES = "1"
npm start
```

Di terminal kedua, dari folder `backend/`:

```powershell
npm install
npm run test:sim
```

Simulasi terhubung ke `http://localhost:3001`, menjalankan 20 pemain melalui room dan fase permainan, lalu mencatat event game di terminal. Hentikan server setelah simulasi selesai.

## CI/CD

Workflow GitHub Actions berada di `.github/workflows/backend-cicd.yml`. Untuk pull request dan push ke `main` yang mengubah backend, workflow menginstal dependency, memeriksa `/health`, lalu menjalankan simulasi game. Push yang berhasil ke `main` juga mengirim backend beserta production dependencies ke cPanel melalui FTPS dan meminta Passenger memulai ulang aplikasi.

Atur GitHub Actions secrets berikut:

- `CPANEL_FTP_SERVER` — hostname FTP cPanel.
- `CPANEL_FTP_USERNAME` — username FTP.
- `CPANEL_FTP_PASSWORD` — password FTP.

FTP user harus dapat menulis ke `/api.allunayah.my.id/warewolf/` (folder `/home/allunaya/api.allunayah.my.id/warewolf` pada File Manager cPanel) dan root FTP harus mengarah ke `/home/allunaya`. Folder tersebut harus menjadi application root Node.js App cPanel. Atur startup file ke `server.js` dan versi Node.js ke `20.20.2` atau versi kompatibel. Atur `CLIENT_ORIGIN` sebagai environment variable aplikasi di cPanel. File `.env` tidak dikirim saat deployment; jangan simpan kredensial deployment di repository.

## Socket.IO events

Event masuk/keluar menggunakan Socket.IO. Aksi `room:create`, `room:join`, `room:rejoin`, `room:leave`, `player:kick`, dan `game:start` dapat menggunakan callback acknowledgement; operasi yang memiliki hasil mengembalikan `{ ok: true, ... }` atau `{ ok: false, error }`.

### Client ke server

| Event | Payload |
|---|---|
| `room:create` | `{ playerName }` |
| `room:join` | `{ roomCode, playerName }` |
| `room:rejoin` | `{ roomCode, playerId }` |
| `room:leave` | Tidak ada |
| `player:ready` | Tidak ada |
| `player:kick` | `{ targetId }` |
| `game:start` | Tidak ada |
| `chat:send` | `{ text }` |
| `vote:cast` | `{ targetId }` |
| `night:action` | Payload aksi role; dapat berisi `targetId`, `targetIdB`, dan `action` |
| `thief:choice` | `{ cardIndex }` (`0` atau `1`) |
| `hunter:shoot` | `{ targetId }` |

### Server ke client

| Event | Penggunaan |
|---|---|
| `room:update` | Status room dan daftar pemain |
| `room:kicked`, `room:leftBehind` | Notifikasi pemain dikeluarkan dari room |
| `game:role`, `game:teammates` | Role dan rekan satu tim, dikirim secara privat |
| `thief:cards`, `cupid:loversAssigned` | Informasi privat untuk kemampuan role |
| `phase:change`, `phase:tick` | Fase aktif, ronde, dan timer |
| `chat:message` | Pesan sistem/chat yang diterima oleh pemain |
| `night:seerResult`, `night:result` | Hasil kemampuan Seer dan resolusi malam |
| `vote:update`, `elimination:reveal` | Progress voting dan hasil eliminasi |
| `hunter:mustShoot`, `hunter:shotResult` | Kesempatan Hunter menembak dan hasilnya |
| `lover:heartbreak` | Pasangan yang ikut mati karena efek Lovers |
| `game:end` | Pemenang dan daftar hasil pemain |

## Serving frontend

Untuk deployment satu layanan, build frontend lalu salin isi `frontend/dist/` ke `backend/public/`. Jika direktori tersebut tersedia saat backend dimulai, Express menyajikan file statis dan mengarahkan route lain selain `/health` ke `index.html`.

Untuk deployment terpisah, atur `VITE_BACKEND_URL` pada frontend ke URL backend dan `CLIENT_ORIGIN` pada backend ke origin frontend. Panduan lengkap ada di [README proyek](../README.md) dan [README frontend](../frontend/README.md).
