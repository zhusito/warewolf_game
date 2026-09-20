import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import { RoomManager } from './src/RoomManager.js';

const PORT = process.env.PORT || 3001;
// Ganti dengan URL frontend kamu waktu deploy (misal: 'https://gamembti.vercel.app')
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

  // ---------- Lobby ----------
  socket.on('player:ready', () => {
    const ctx = socketToPlayer.get(socket.id);
    if (!ctx) return;
    const room = roomManager.getRoom(ctx.roomCode);
    room?.toggleReady(ctx.playerId);
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

    if (room.status === 'lobby') {
      // Di lobby, keluar beneran menghapus slot pemain.
      room.removePlayer(ctx.playerId);
      roomManager.removeRoomIfEmpty(ctx.roomCode);
    } else {
      // Saat game jalan, cuma ditandai terputus supaya bisa reconnect (room:rejoin).
      room.markDisconnected(ctx.playerId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Werewolf backend jalan di http://localhost:${PORT}`);
});
