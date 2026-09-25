# Game MBTI Frontend

Aplikasi frontend React + Vite untuk game Werewolf multiplayer. UI ini terhubung langsung ke backend Socket.io dan digunakan untuk login, lobby, game flow, serta hasil akhir.

## Fitur utama

- Login player dan masuk ke halaman utama
- Create room dan join room private
- Waiting room dengan status ready dan host controls
- Game area untuk fase malam, diskusi, voting, dan eliminasi
- Result screen dan bagaimana menang
- Audio/BGM support di beberapa screen
- Integrasi dengan `socket.io-client` untuk komunikasi real-time

## Stack

- React 19
- Vite
- React Router
- Socket.io Client

## Menjalankan frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

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
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── roleImages.js
│   ├── socket.js
│   ├── assets/
│   ├── context/
│   │   └── GameContext.jsx
│   ├── pages/
│   │   ├── GameArea.jsx
│   │   ├── Home.jsx
│   │   ├── HowToPlay.jsx
│   │   ├── Login.jsx
│   │   ├── PrivateRoom.jsx
│   │   ├── Result.jsx
│   │   └── WaitingRoom.jsx
│   └── utils/
│       └── soundManager.js
├── vercel.json
├── vite.config.js
└── README.md
```

## Routing utama

- `/` → Login
- `/home` → Menu utama
- `/private-room` → Join room
- `/room` → Waiting room
- `/game` → Game area
- `/result` → Hasil permainan
- `/how-to-play` → Panduan bermain

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

Pastikan `VITE_BACKEND_URL` diubah ke URL backend produksi.

## Catatan

- UI sudah terhubung ke backend real-time dan tidak lagi mengandalkan data mock untuk flow utama
- Masih ada beberapa kebutuhan QA/validasi manual terkait reconnect, room flow, dan session handling pada deployment nyata
- Untuk detail backend, lihat [../backend/README.md](../backend/README.md)

---

Untuk dokumentasi proyek secara keseluruhan, lihat [../README.md](../README.md).
