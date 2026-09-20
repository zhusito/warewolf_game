# Werewolf Backend

Backend real-time (room + logic game) untuk game Werewolf, dipasangkan dengan
frontend React `gamembti`. Dibuat dengan **Node.js + Express + Socket.io**,
state disimpan **in-memory** (cukup untuk MVP — data hilang kalau server restart).

## Fitur

- Buat & join room pakai kode 6 karakter (mirip kode game party biasa)
- Sistem ready sebelum game mulai (host yang mulai, minimal 7 pemain, semua harus ready)
- Assign role otomatis & acak: **Werewolf, Seer, Guardian, Villager**
  (role lain di asset frontend seperti Witch/Hunter/Cupid/dll belum diimplementasikan —
  tinggal ditambah di `src/roles.js` + `src/Room.js` kalau logic-nya sudah siap di frontend)
- State machine fase penuh di server: **Malam → Diskusi → Voting → Elimination → (ulang)**
- Night action: Werewolf membunuh, Guardian melindungi, Seer mengintip role
- Voting + reveal role yang tereliminasi
- Deteksi kondisi menang otomatis (Werewolf vs Villager)
- Reconnect: kalau koneksi putus saat game jalan, slot pemain tidak langsung hilang
  (bisa `room:rejoin` pakai `roomCode` + `playerId` yang sama)

## Menjalankan

```bash
npm install
cp .env.example .env   # sesuaikan CLIENT_ORIGIN kalau perlu
npm start
```

Server jalan di `http://localhost:3001` (atau sesuai `PORT` di `.env`).
Cek `GET /health` untuk memastikan server hidup.

### Testing tanpa frontend

Ada script simulasi yang jalanin 7 "pemain" palsu lewat `socket.io-client`,
dari room dibuat sampai game selesai — berguna buat ngetes perubahan di
`src/Room.js` tanpa perlu buka browser:

```bash
# Terminal 1
FAST_PHASES=1 npm start   # FAST_PHASES mempercepat durasi fase jadi hitungan detik

# Terminal 2
npm run test:sim
```

## Struktur project

```
server.js            # entry point: Express + Socket.io + wiring semua event
src/roles.js          # definisi role & logic pembagian role acak
src/Room.js           # state machine 1 room (lobby, fase, voting, win condition)
src/RoomManager.js    # buat/cari/hapus room, generate kode room
tests/simulate-full-game.js  # simulasi end-to-end pakai socket.io-client
```

## Cara integrasi ke frontend `gamembti`

Di frontend, install client-nya:

```bash
npm install socket.io-client
```

Contoh koneksi dasar:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001'); // ganti sesuai URL backend saat deploy
```

### Event yang dikirim CLIENT → SERVER

| Event | Payload | Keterangan |
|---|---|---|
| `room:create` | `{ playerName }` | Buat room baru. Callback: `{ ok, roomCode, playerId }` |
| `room:join` | `{ roomCode, playerName }` | Join room. Callback: `{ ok, roomCode, playerId }` atau `{ ok:false, error }` |
| `room:rejoin` | `{ roomCode, playerId }` | Dipakai saat reconnect (simpan `playerId` & `roomCode` di localStorage) |
| `player:ready` | *(tanpa payload)* | Toggle status ready pemain sendiri |
| `game:start` | *(tanpa payload)* | Hanya berlaku kalau dikirim oleh host. Callback: `{ ok, error? }` |
| `chat:send` | `{ text }` | Kirim pesan chat (diblokir otomatis kalau fase Malam) |
| `vote:cast` | `{ targetId }` | Vote pemain lain saat fase Voting |
| `night:action` | `{ targetId }` | Aksi malam (khusus Werewolf/Seer/Guardian) |

### Event yang diterima SERVER → CLIENT

| Event | Payload | Keterangan |
|---|---|---|
| `room:update` | `{ code, hostId, status, players[], minPlayers, maxPlayers }` | Update daftar pemain & status room (dikirim tiap ada perubahan) |
| `game:role` | `{ role, team, description }` | Dikirim **privat** ke masing-masing socket saat game mulai |
| `phase:change` | `{ phase, timeLeft }` | Fase baru dimulai: `Malam`, `Diskusi`, `Voting`, `Elimination` |
| `phase:tick` | `{ timeLeft }` | Countdown tiap detik untuk sinkronisasi timer di UI |
| `chat:message` | `{ id, sender, text, time, isSystem }` | Pesan chat baru (termasuk pesan sistem) |
| `night:seerResult` | `{ targetId, targetName, team }` | Dikirim **privat** ke Seer setelah dia mengintip target |
| `night:result` | `{ eliminated: {id,name,role} \| null }` | Hasil malam (siapa yang mati, atau tidak ada korban) |
| `vote:update` | `{ voteCount, aliveCount }` | Progres voting real-time (opsional dipakai di UI) |
| `elimination:reveal` | `{ id, name, role, isWerewolf } \| null` | Hasil voting siang (null kalau suara seri) |
| `game:end` | `{ winner: 'werewolves'\|'villagers', players[] }` | Game selesai, role semua pemain di-reveal |

Struktur payload di atas sengaja dibuat semirip mungkin dengan nama field yang
sudah dipakai di mock data `WaitingRoom.jsx` dan `GameArea.jsx` (`id`, `name`,
`status`/`alive`, `role`, dll), supaya nanti tinggal ganti sumber data dari
`useState` mock jadi state hasil event socket di atas.

## Yang masih perlu dikerjakan / catatan

- **Belum ada persistence** — kalau server restart, semua room & progress hilang.
  Cukup untuk MVP/demo; kalau nanti mau lanjut ke Redis/DB tinggal ganti isi `RoomManager`.
- **Role baru** (Witch, Hunter, Cupid, King, dll) belum ada logic-nya — perlu
  ditambahkan di `src/roles.js` (definisi & rasio) dan `src/Room.js` (night action & efeknya)
  begitu logic-nya di frontend juga siap.
- **Belum ada validasi anti-cheat ketat** (misalnya memastikan hanya role yang
  benar yang bisa emit `night:action` tertentu — ini sudah dicek di server,
  tapi belum ada rate limiting / anti-spam socket).
- Durasi tiap fase ada di `src/Room.js` (`PHASE_DURATION`) — sesuaikan dengan
  timer yang mau dipakai di frontend (saat ini: Malam 45s, Diskusi 60s, Voting 30s, Elimination 8s).
