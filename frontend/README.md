# Frontend Game Werewolf MBTI

Aplikasi web Game Hub dan Werewolf multiplayer. Frontend menangani tampilan dan navigasi; room, fase, timer, serta hasil permainan dikelola backend melalui Socket.IO.

## Stack

- React 19
- Vite 8
- React Router 7
- Socket.IO Client 4

Gunakan Node.js 20.19+ atau 22.12+ untuk Vite 8.

## Menjalankan lokal

Jalankan backend terlebih dahulu mengikuti [petunjuk backend](../backend/README.md), lalu di terminal frontend:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

Konfigurasi `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3001
```

Variabel ini menentukan URL Socket.IO backend. Nilai tersebut dibaca saat frontend dijalankan atau dibangun.

## Halaman

- `/` — Game Hub, dengan tautan ke Werewolf MBTI dan survey preferensi musik.
- `/werewolf` — login dan pengaturan username.
- `/werewolf/home` — buat room atau pilih bergabung dengan room privat; tautan ke panduan bermain.
- `/werewolf/private-room` — bergabung menggunakan kode room.
- `/werewolf/room` — lobby, status siap, dan kontrol host.
- `/werewolf/game` — fase game, chat, voting, dan aksi role.
- `/werewolf/result` — hasil game.
- `/werewolf/how-to-play` — aturan, fase, tim, dan role.

## Perilaku yang tersedia

- Koneksi real-time ke backend dengan Socket.IO.
- Nama, kode room, dan ID pemain disimpan di `localStorage`; sesi dicoba untuk di-rejoin saat halaman dimuat ulang.
- Notifikasi saat pemain di-kick atau ditinggal host karena belum siap.
- Efek audio dan musik latar pada menu, fase permainan, serta layar hasil.
- UI dan aset role berada di `src/features/werewolf/`; logika state dan event socket berada di `context/GameContext.jsx`.

## Build, lint, dan preview

```powershell
npm run lint
npm run build
npm run preview
```

Build production dibuat di `dist/`. Konfigurasi `vercel.json` mengarahkan semua route ke `index.html` agar routing client-side dapat dimuat langsung.

## Deployment

Frontend dapat dideploy ke Vercel, Netlify, atau static hosting yang mendukung aplikasi Vite dan fallback ke `index.html`. Atur `VITE_BACKEND_URL` ke URL backend production sebelum build, dan pastikan backend mengizinkan origin frontend melalui `CLIENT_ORIGIN`.

Untuk menyajikan frontend dan backend dari satu layanan, build frontend lalu salin isi `dist/` ke `backend/public/`. Backend akan melayani file hasil build dan fallback route ke `index.html`.

Untuk penyiapan fullstack dan aturan game, lihat [README proyek](../README.md) dan [README backend](../backend/README.md).
