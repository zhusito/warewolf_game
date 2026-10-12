# Game MBTI Frontend

Aplikasi frontend React + Vite untuk Game Hub dan game Werewolf multiplayer. UI Werewolf terhubung ke backend Socket.io untuk login, lobby, game flow, dan hasil akhir.

## Fitur utama

- Game Hub di `/` dengan tombol Werewolf MBTI dan tombol Game Lainnya (tautan placeholder `#`)
- Login player dan masuk ke menu Werewolf
- Create room dan join room private
- Waiting room dengan status ready dan host controls
- Game area untuk fase malam, diskusi, voting, dan eliminasi
- Result screen dan panduan bermain
- Audio/BGM support di beberapa screen
- Integrasi dengan `socket.io-client` untuk komunikasi real-time
- Reconnect dan rejoin session setelah refresh

## Stack

- React 19
- Vite 8
- React Router 7
- Socket.io Client

## Menjalankan frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Gunakan Node.js 20.19+ atau 22.12+ untuk Vite 8.

Frontend biasanya akan berjalan di:

- `http://localhost:5173`

## Environment

File `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3001
```

Gunakan URL backend yang sesuai jika development atau production dipisah.

## Struktur project

```bash
frontend/
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   └── features/
│       ├── home/
│       │   └── pages/Home.jsx
│       └── werewolf/
│           ├── WerewolfApp.jsx
│           ├── assets/
│           ├── context/GameContext.jsx
│           ├── pages/
│           ├── roleImages.js
│           └── services/
│               ├── socket.js
│               └── soundManager.js
├── vercel.json
├── vite.config.js
└── README.md
```

## Routing utama

- `/` → Game Hub
- `/werewolf` → Login Werewolf
- `/werewolf/home` → Menu pilih mode
- `/werewolf/private-room` → Bergabung dengan kode room
- `/werewolf/room` → Waiting room
- `/werewolf/game` → Game area
- `/werewolf/result` → Hasil permainan
- `/werewolf/how-to-play` → Panduan bermain

## Build production

```bash
cd frontend
npm run build
```

Output build akan dibuat ke folder `dist/`.

## Deployment

Frontend bisa dideploy ke:

- Vercel
- Netlify
- static hosting lain yang mendukung build Vite

Pastikan `VITE_BACKEND_URL` diubah ke URL backend produksi sebelum build. Untuk deployment satu layanan, salin isi `dist/` ke `backend/public/`; backend akan menyajikan build tersebut dan menangani fallback route.

## Catatan

- UI sudah terhubung ke backend real-time dan tidak lagi mengandalkan data mock untuk flow utama
- Masih ada beberapa kebutuhan QA/validasi manual terkait reconnect, room flow, dan session handling pada deployment nyata
- Untuk detail backend, lihat [../backend/README.md](../backend/README.md)

---

Untuk dokumentasi proyek secara keseluruhan, lihat [../README.md](../README.md).
