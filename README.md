# Game Werewolf MBTI — Fullstack

Monorepo untuk game Werewolf multiplayer berbasis browser dengan arsitektur fullstack:

- `backend/` — server Node.js + Express + Socket.io untuk room, lobby, game state, dan timer server-side
- `frontend/` — aplikasi React + Vite untuk UI login, waiting room, game area, dan result screen

## Ringkasan project

Project ini mengimplementasikan gameplay Werewolf dengan alur real-time multiplayer:

- Buat room dan join room dengan kode room
- Lobby dengan ready check dan host-controlled start
- Fase malam, diskusi, voting, eliminasi, dan menang otomatis
- Chat in-game, role assignment, night actions, serta reveal hasil akhir
- Reconnect session dan leave room
- Mode deploy terpisah maupun single-service deployment (backend bisa serve frontend build hasil produksi)

## Struktur folder

```bash
gamembti-fullstack/
├── README.md
├── backend/
│   ├── README.md
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── src/
│   └── tests/
├── frontend/
│   ├── README.md
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
└── package.json (jika ada di masa depan)
```

## Persyaratan

- Node.js 18+
- npm
- 2 terminal terpisah untuk development

## Cara menjalankan development

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Server backend akan berjalan di:

- `http://localhost:3001`

Cek health check:

```bash
curl http://localhost:3001/health
```

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend biasanya berjalan di:

- `http://localhost:5173`

Buka URL tersebut di browser, lalu buat room baru atau join room teman.

## Variabel environment

### Backend

File: `backend/.env`

```env
PORT=3001
CLIENT_ORIGIN=*
```

- `PORT` = port server backend
- `CLIENT_ORIGIN` = origin frontend yang diizinkan untuk CORS
- Untuk deploy production, isi dengan URL frontend yang benar, bukan `*`

### Frontend

File: `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:3001
```

- `VITE_BACKEND_URL` = URL Socket.io backend yang digunakan UI

## Fitur yang tersedia saat ini

- Lobby room multiplayer real-time
- Room create & join dengan kode room
- Ready check sebelum game mulai
- Host-only start game
- Role assignment otomatis untuk berbagai role di backend
- Fase permainan: malam, diskusi, voting, eliminasi
- Chat dan voting real-time
- Night action untuk role tertentu seperti werewolf, seer, guardian, hunter, thief
- Rejoin session setelah refresh atau reconnect
- Leave room dan kick player oleh host
- Result screen akhir

## Cara main

1. Buka frontend di browser
2. Masukkan nama player
3. Salah satu pemain buat room baru
4. Pemain lain menggunakan menu Private Room dan kode room
5. Pastikan semua pemain ready
6. Host memulai game
7. Ikuti alur permainan sampai hasil akhir muncul

## Deployment

### Backend

Backend sebaiknya di-deploy ke layanan yang mendukung Node.js long-running process, seperti:

- Railway
- Render
- Fly.io
- VPS

### Frontend

Frontend bisa di-deploy ke Vercel atau Netlify dengan build normal:

```bash
cd frontend
npm run build
```

Setelah deploy:

- backend `.env` → `CLIENT_ORIGIN` isi URL frontend produksi
- frontend `.env` → `VITE_BACKEND_URL` isi URL backend produksi

## Catatan penting

- State room dan game saat ini disimpan in-memory di backend, jadi data akan hilang saat server restart
- Project masih cocok untuk MVP / demo / internal test sebelum produksi penuh
- Untuk environment production, perlu pertimbangan tambahan seperti persist database, monitoring, CI/CD, dan anti-bug pada room/session management

## Status proyek

Project ini sudah cukup layak untuk development lokal dan test multiplayer internal. Untuk deployment mult-user nyata, masih disarankan untuk melakukan testing end-to-end terlebih dahulu, terutama untuk:

- room ownership / disconnect behavior
- rejoin dan duplicate player
- minimum player validation
- leave room dan kick flow
- ready-state visibility di waiting room
- session persistence antar tab/device

Jika ingin lanjut ke production, langkah selanjutnya yang disarankan adalah:

- validasi flow manual penuh di browser multi-tab
- menambahkan CI/CD sederhana
- menguji edge case koneksi dan disconnect dengan beberapa pemain
- mempertimbangkan pengurangan minimum player atau rule custom untuk room

---

Dokumentasi lebih detail untuk masing-masing bagian ada di:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
