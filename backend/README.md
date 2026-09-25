# Werewolf Backend

Backend untuk game Werewolf multiplayer yang dibuat dengan Node.js, Express, dan Socket.io.
State room dan permainan disimpan di memory server, sehingga cocok untuk MVP dan demo lokal.

## Fitur utama

- Buat room dan join room dengan kode room
- Lobby dengan status ready dan host-controlled start
- Host bisa kick player
- Player bisa leave room secara sengaja
- Reconnect / rejoin session jika koneksi terputus
- Timer fase server-side untuk game loop
- Event chat, vote, night action, dan eliminasi
- Auto win condition: Werewolves vs Villagers
- Support room cleanup saat disconnect grace period habis

## Stack

- Node.js
- Express
- Socket.io
- CORS

## Menjalankan backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Server berjalan di:

- `http://localhost:3001`

Untuk mengecek server hidup:

```bash
curl http://localhost:3001/health
```

## Environment

File `backend/.env`:

```env
PORT=3001
CLIENT_ORIGIN=*
```

Penjelasan:

- `PORT` = port yang dipakai server
- `CLIENT_ORIGIN` = origin frontend yang diizinkan oleh CORS

Untuk production, ganti `CLIENT_ORIGIN` menjadi URL frontend yang benar.

## Testing

Ada script simulasi game end-to-end yang menjalankan banyak pemain palsu melalui socket.io-client:

```bash
npm run test:sim
```

Untuk memercepat fase permainan, bisa dijalankan dengan:

```bash
FAST_PHASES=1 npm start
```

## Struktur project

```bash
backend/
├── .env.example
├── package.json
├── server.js
├── src/
│   ├── Room.js
│   ├── RoomManager.js
│   └── roles.js
├── tests/
│   └── simulate-full-game.js
└── README.md
```

## Socket events

### Client ke server

- `room:create` → `{ playerName }`
- `room:join` → `{ roomCode, playerName }`
- `room:rejoin` → `{ roomCode, playerId }`
- `room:leave` → tanpa payload
- `player:ready` → tanpa payload
- `player:kick` → `{ targetId }`
- `game:start` → tanpa payload
- `chat:send` → `{ text }`
- `vote:cast` → `{ targetId }`
- `night:action` → `{ ...payload }`
- `thief:choice` → `{ cardIndex }`
- `hunter:shoot` → `{ targetId }`

### Server ke client

- `room:update`
- `game:role`
- `game:teammates`
- `phase:change`
- `phase:tick`
- `chat:message`
- `night:result`
- `night:seerResult`
- `elimination:reveal`
- `thief:cards`
- `cupid:loversAssigned`
- `hunter:mustShoot`
- `game:end`
- `room:kicked`
- `room:leftBehind`

## Catatan implementasi

- Backend saat ini masih menggunakan in-memory storage, jadi semua room akan reset saat server restart
- Role dan gameplay bisa ditambah/dikembangkan lebih lanjut di `src/roles.js` dan `src/Room.js`
- Flow minimal player dan reconnect behavior masih perlu divalidasi lebih lanjut untuk deployment skala nyata

## Produksi / deployment

Untuk deployment production, pastikan:

1. Backend berjalan di proses Node.js yang stabil
2. CORS `CLIENT_ORIGIN` diset ke URL frontend yang valid
3. Monitoring dan logging disiapkan untuk menangani disconnect dan room state
4. Script CI/CD dibutuhkan untuk validasi otomatis sebelum deploy

---

Untuk penggunaan bersama frontend project, lihat [../frontend/README.md](../frontend/README.md).
