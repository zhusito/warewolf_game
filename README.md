# Game Werewolf MBTI

Monorepo untuk Game Hub browser dan game Werewolf multiplayer real-time.

- `frontend/` — UI React 19, Vite 8, React Router, dan Socket.IO Client.
- `backend/` — server Node.js, Express, dan Socket.IO; mengelola room, pemain, fase, serta aturan permainan.

Semua dokumentasi menggunakan kondisi implementasi saat ini. Untuk detail komponen, lihat [frontend/README.md](frontend/README.md) dan [backend/README.md](backend/README.md).

## Persyaratan

- Node.js 20.19+ atau 22.12+ (persyaratan Vite 8)
- npm
- Browser modern

## Menjalankan secara lokal

Jalankan backend dan frontend di dua terminal terpisah.

### Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm start
```

Server berjalan pada `http://localhost:3001` secara default. Periksa statusnya di `http://localhost:3001/health`.

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Buka URL yang ditampilkan Vite (biasanya `http://localhost:5173`). Isi lokal pada `frontend/.env` menunjuk ke backend `http://localhost:3001`.

Di Game Hub, pilih **Werewolf MBTI**. Masukkan nama, buat room, atau bergabung dengan kode room teman. Opsi **Survey music preference** membuka formulir eksternal.

## Fitur game

- Room privat dengan kode enam karakter; maksimal 30 pemain dan minimal 7 pemain siap untuk memulai.
- Host dapat memulai game dan mengeluarkan pemain dari lobby. Pemain yang belum siap saat game dimulai akan dikeluarkan.
- Fase Malam, Diskusi, Voting, dan Elimination; aksi dan timer dikelola server.
- Chat siang, chat tim jahat saat malam, serta kanal terpisah untuk pemain yang sudah mati.
- Role dan kemampuan: Werewolf, Alpha Werewolf, Vampire, Cursed, Lycan, Strong Villager, Guardian, Seer, Witch, Hunter, Cupid, King, Troublemaker, Thief, dan Villager. Role yang dibagikan bergantung pada jumlah pemain.
- Reconnect/rejoin menggunakan sesi yang tersimpan di browser. Pemain yang terputus di lobby mendapat grace period 20 detik; selama game berlangsung, pemain tidak langsung dihapus.
- Kondisi menang untuk tim Werewolf, Vampire, Villager, atau sepasang Lovers yang menjadi dua pemain terakhir.

Room dan game state disimpan di memori backend; restart server akan menghapus semua room.

## Pengujian dan build

```powershell
cd frontend
npm run lint
npm run build
```

Simulasi backend menjalankan 20 pemain Socket.IO dan membutuhkan backend yang sedang berjalan. Di terminal backend, jalankan:

```powershell
cd backend
$env:FAST_PHASES = "1"
npm start
```

Di terminal lain:

```powershell
cd backend
npm run test:sim
```

`FAST_PHASES=1` memperpendek fase menjadi 4 detik malam, 3 detik diskusi, 3 detik voting, dan 2 detik eliminasi. Hapus variabel tersebut atau buka terminal baru untuk kembali ke durasi normal.

## Deployment

- Frontend dapat dibangun dengan `npm run build` di `frontend/` dan dideploy ke static hosting. Set `VITE_BACKEND_URL` ke URL backend sebelum build.
- Backend membutuhkan proses Node.js yang terus berjalan. Set `CLIENT_ORIGIN` ke origin frontend untuk konfigurasi CORS; `PORT` mengatur port server (default `3001`).
- Untuk satu layanan, salin isi `frontend/dist/` ke `backend/public/` setelah build. Jika folder tersebut ada, backend menyajikan file statis dan fallback route frontend.

Contoh variabel backend tersedia di `backend/.env.example`, sedangkan variabel frontend di `frontend/.env.example`.
