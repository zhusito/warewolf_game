# Game Werewolf MBTI — Fullstack

Monorepo untuk Game Hub berbasis browser dan game Werewolf multiplayer:

- `frontend/` — aplikasi React + Vite. Game Hub ada di `/`; game Werewolf berada di `/werewolf/*`.
- `backend/` — server Node.js + Express + Socket.io untuk room, lobby, game state, dan timer server-side.

## Ringkasan project

Game Werewolf mengimplementasikan gameplay real-time multiplayer:

- Buat room dan join room dengan kode room
- Lobby dengan ready check dan host-controlled start
- Fase Malam, Diskusi, Voting, Elimination, dan penentuan kemenangan
- Chat in-game, role assignment, night actions, serta reveal hasil akhir
- Reconnect session dan leave room
- Deployment frontend/backend terpisah atau satu layanan (backend menyajikan build frontend dari `backend/public/`)

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
```

## Persyaratan

- Node.js 20.19+ atau 22.12+ untuk Vite 8
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

Buka URL tersebut di browser. Pilih Werewolf MBTI di Game Hub, masukkan nama pemain, lalu buat room baru atau join room teman. Tombol Game Lainnya di hub saat ini masih berupa tautan placeholder `#`.

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

- `VITE_BACKEND_URL` = URL Socket.io backend yang digunakan UI (default lokal: `http://localhost:3001`)

## Fitur yang tersedia saat ini

- Lobby room multiplayer real-time
- Room create & join dengan kode room
- Ready check sebelum game mulai
- Host-only start game
- 7–30 pemain per room; minimal 7 pemain ready untuk memulai. Pemain yang belum ready dikeluarkan saat host memulai game.
- Role assignment otomatis dari tim Werewolf, Vampire, dan Villager; pasangan Lovers juga dapat menang bersama
- Fase permainan: Malam, Diskusi, Voting, dan Elimination
- Chat dan voting real-time
- Aksi malam dan kemampuan role seperti Werewolf, Vampire, Seer, Guardian, Witch, Hunter, Cupid, King, Troublemaker, dan Thief
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

Frontend dapat di-deploy terpisah ke Vercel atau Netlify dengan build normal:

```bash
cd frontend
npm run build
```

Setelah deploy:

- backend `.env` → `CLIENT_ORIGIN` isi URL frontend produksi
- frontend `.env` → `VITE_BACKEND_URL` isi URL backend produksi

Untuk deployment satu layanan, build frontend lalu salin isi `frontend/dist/` ke `backend/public/` sebelum menjalankan backend. Jika folder itu tersedia, backend otomatis menyajikan file statis dan mengarahkan route frontend ke `index.html`.

## Catatan penting

- State room dan game saat ini disimpan in-memory di backend, jadi data akan hilang saat server restart
- Project masih cocok untuk MVP / demo / internal test sebelum produksi penuh
- Untuk environment production, perlu pertimbangan tambahan seperti persist database, monitoring, CI/CD, dan anti-bug pada room/session management

## Status proyek

Room dan game state disimpan di memory backend dan hilang saat server restart. Sebelum deployment untuk banyak pengguna, uji end-to-end terutama pada reconnect, perpindahan host, dan sesi lintas tab/perangkat.

Jika ingin lanjut ke production, langkah selanjutnya yang disarankan adalah:

- validasi flow manual penuh di browser multi-tab
- menambahkan CI/CD sederhana
- menguji edge case koneksi dan disconnect dengan beberapa pemain
- mempertimbangkan pengurangan minimum player atau rule custom untuk room

---

Dokumentasi lebih detail untuk masing-masing bagian ada di:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
