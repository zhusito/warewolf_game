# Game Werewolf MBTI — Fullstack

Folder ini isinya 2 project:

- `frontend/` — React app `gamembti` (sudah disambungkan ke backend, tidak pakai data mock lagi)
- `backend/` — Node.js + Express + Socket.io (room + semua logic game, in-memory)

## Cara menjalankan (development)

Buka 2 terminal:

**Terminal 1 — Backend**
```bash
cd backend
npm install
cp .env.example .env
npm start
```
Backend jalan di `http://localhost:3001`.

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Buka URL yang muncul (biasanya `http://localhost:5173`).

Untuk main beneran sama teman-teman: buka beberapa tab/device berbeda ke URL frontend yang sama,
masing-masing isi nama lalu satu orang "Buat Room Baru" (jadi host), sisanya pakai
"Private Room" dan masukkan kode room yang muncul di layar host.

## Yang sudah jalan

- Semua 15 role: Werewolf, Alpha Werewolf, Vampire, Cursed, Lycan, Strong Villager,
  Guardian, Seer, Witch, Hunter, Cupid, King, Troublemaker, Thief, Villager
  (role makin banyak dibuka otomatis sesuai jumlah pemain — lihat `backend/src/roles.js`)
- Room & lobby real-time, ready-check, host-only start
- Fase Malam → Diskusi → Voting → Elimination dengan timer server-side
- Chat, voting, panel aksi malam yang otomatis menyesuaikan role
- Reveal hasil akhir (menang Werewolf / Villager / Vampire / sepasang Lovers)

## Yang perlu ditest manual sebelum dipakai beneran

Bagian backend sudah divalidasi lewat simulasi otomatis (20 "pemain" palsu, semua role,
sampai game selesai — lihat `backend/tests/simulate-full-game.js`). Bagian **frontend
baru divalidasi sebatas build berhasil**, belum dicoba manual di browser dengan banyak tab.
Sebelum dipakai temanmu, coba dulu sendiri:

1. Buka beberapa tab browser (7+ tab biar bisa mulai game), masing-masing jadi 1 "pemain"
2. Ikuti alur penuh: buat room → semua join & ready → mulai game → coba kirim aksi malam
   untuk tiap role → lanjut ke Diskusi → Voting → lihat hasil Elimination → ulang sampai
   game selesai → cek halaman Result
3. Kalau ada bagian yang error/aneh secara visual, kasih tahu saya detailnya (role apa,
   fase apa, pesan error di console browser kalau ada) — saya bantu perbaiki

## Deploy (kalau sudah mau dipakai beneran, bukan cuma localhost)

- Backend bisa di-deploy ke layanan seperti Railway/Render/Fly.io (butuh proses Node.js
  yang jalan terus, bukan platform static hosting)
- Frontend bisa di-deploy ke Vercel/Netlify (build dengan `npm run build`, output di `dist/`)
- Setelah deploy, update:
  - `backend/.env` → `CLIENT_ORIGIN` isi URL frontend yang sudah live
  - `frontend/.env` → `VITE_BACKEND_URL` isi URL backend yang sudah live
