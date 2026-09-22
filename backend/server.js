// backend/server.js
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import { RoomManager } from './src/RoomManager.js';
import { DISCONNECT_GRACE_MS } from './src/Room.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
// Kalau frontend & backend jadi 1 layanan yang sama (satu origin), CLIENT_ORIGIN
// nggak terlalu penting lagi — tapi tetap dijaga buat kasus deploy terpisah.
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] }
});

const roomManager = new RoomManager(io);

// socket.id (koneksi TCP saat ini) --> playerId (identitas pemain, tetap sama walau reconnect)
const socketToPlayer = new Map(); // socket.id -> { playerId, roomCode }

io.on('connection', (socket) => {
  // ---------- Buat room baru (host) ----------
  socket.on('room:create', ({ playerName }, ack) => {
    try {
      const room = roomManager.createRoom();
      const playerId = randomUUID();

      room.addPlayer(playerId, playerName?.trim() || 'Host', socket.id);
      socket.join(room.code);
      socketToPlayer.set(socket.id, { playerId, roomCode: room.code });

      ack?.({ ok: true, roomCode: room.code, playerId });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  // ---------- Join room yang sudah ada ----------
  socket.on('room:join', ({ roomCode, playerName }, ack) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room tidak ditemukan.');

      const playerId = randomUUID();
      room.addPlayer(playerId, playerName?.trim() || 'Player', socket.id);
      socket.join(room.code);
      socketToPlayer.set(socket.id, { playerId, roomCode: room.code });

      ack?.({ ok: true, roomCode: room.code, playerId });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  // ---------- Reconnect ke room (misal setelah refresh halaman) ----------
  socket.on('room:rejoin', ({ roomCode, playerId }, ack) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.players.has(playerId)) {
      ack?.({ ok: false, error: 'Sesi room tidak ditemukan.' });
      return;
    }
    room.markReconnected(playerId, socket.id);
    socket.join(room.code);
    socketToPlayer.set(socket.id, { playerId, roomCode: room.code });
    ack?.({ ok: true, room: { code: room.code, status: room.status, phase: room.phase, timeLeft: room.timeLeft } });
  });

  // ---------- Keluar dari room secara sengaja (tombol "Leave Room") ----------
  socket.on('room:leave', (_, ack) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) { ack?.({ ok: true }); return; }

    const room = roomManager.getRoom(ctx.roomCode);
    if (room) {
      room.removePlayer(ctx.playerId);
      socket.leave(room.code);
      roomManager.removeRoomIfEmpty(ctx.roomCode);
    }
    socketToPlayer.delete(socket.id);
    ack?.({ ok: true });
  });

  // ---------- Lobby ----------
  socket.on('player:ready', () => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.toggleReady(ctx.playerId);
  });

  // Host nge-kick pemain lain dari lobby
  socket.on('player:kick', ({ targetId }, ack) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    if (!room) { ack?.({ ok: false, error: 'Room tidak ditemukan.' }); return; }

    try {
      const kickedSocketId = room.kickPlayer(ctx.playerId, targetId);
      const kickedSocket = io.sockets.sockets.get(kickedSocketId);
      if (kickedSocket) {
        kickedSocket.leave(room.code);
        socketToPlayer.delete(kickedSocketId);
      }
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  socket.on('game:start', (_, ack) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    if (!room) return ack?.({ ok: false, error: 'Room tidak ditemukan.' });
    if (room.hostId !== ctx.playerId) return ack?.({ ok: false, error: 'Hanya host yang bisa mulai game.' });

    try {
      room.startGame();
      ack?.({ ok: true });
    } catch (err) {
      ack?.({ ok: false, error: err.message });
    }
  });

  // ---------- In-game ----------
  socket.on('chat:send', ({ text }) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx || !text?.trim()) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.sendChat(ctx.playerId, text.trim());
  });

  socket.on('vote:cast', ({ targetId }) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.castVote(ctx.playerId, targetId);
  });

  socket.on('night:action', (payload) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.submitNightAction(ctx.playerId, payload || {});
  });

  socket.on('thief:choice', ({ cardIndex }) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.submitThiefChoice(ctx.playerId, cardIndex);
  });

  socket.on('hunter:shoot', ({ targetId }) => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.submitHunterShot(ctx.playerId, targetId);
  });

  // ---------- Disconnect ----------
  socket.on('disconnect', () => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    socketToPlayer.delete(socket.id);

    const room = roomManager.getRoom(ctx.roomCode);
    if (!room) return;

    // markDisconnected sendiri yang urus: kalau masih di lobby, dikasih grace
    // period dulu (lihat DISCONNECT_GRACE_MS) sebelum beneran dihapus; kalau
    // game sudah jalan, cuma ditandai putus (nunggu room:rejoin kapan saja).
    room.markDisconnected(ctx.playerId);

    // Jaga-jaga: kalau room ini sampai kosong total gara-gara grace period
    // habis (dan tidak ada yang emit room:leave), tetap dibersihkan dari RoomManager.
    setTimeout(() => {
      roomManager.removeRoomIfEmpty(ctx.roomCode);
    }, DISCONNECT_GRACE_MS + 1000);
  });
});

// ---------- Serve frontend (kalau di-build & digabung jadi 1 layanan) ----------
// Kalau folder ./public ada (hasil build React di-copy ke sini, lihat README),
// backend ini SEKALIAN jadi web server buat frontend-nya. Jadi cukup 1 deploy, 1 URL.
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // Semua route selain /health & socket.io diarahkan ke index.html,
  // biar React Router (BrowserRouter) yang urus routing di sisi client.
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
  console.log('Mode gabungan aktif: frontend di-serve dari ./public');
}

server.listen(PORT, () => {
  console.log(`Werewolf backend jalan di http://localhost:${PORT}`);
});