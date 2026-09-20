import { io as ioClient } from 'socket.io-client';

const URL = 'http://localhost:3001';
const NUM_PLAYERS = 20; // cukup besar biar semua role (termasuk Vampire & Thief, min 16) ikut ke-roll

function connectPlayer() {
  return new Promise((resolve, reject) => {
    const socket = ioClient(URL);
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', (err) => reject(err));
  });
}

async function main() {
  const sockets = [];
  for (let i = 0; i < NUM_PLAYERS; i++) sockets.push(await connectPlayer());

  const playerIds = new Array(NUM_PLAYERS);
  const roles = new Map(); // index -> { role, team }
  let alivePlayers = [];

  const host = sockets[0];
  const roomCode = await new Promise((resolve) => {
    host.emit('room:create', { playerName: 'P1' }, (res) => { playerIds[0] = res.playerId; resolve(res.roomCode); });
  });
  for (let i = 1; i < NUM_PLAYERS; i++) {
    await new Promise((resolve) => {
      sockets[i].emit('room:join', { roomCode, playerName: `P${i + 1}` }, (res) => { playerIds[i] = res.playerId; resolve(); });
    });
  }
  console.log('Semua', NUM_PLAYERS, 'player join. OK:', playerIds.every(Boolean));

  function aliveExcluding(...excludeIds) {
    return alivePlayers.filter(p => p.alive && !excludeIds.includes(p.id));
  }

  sockets.forEach((s, i) => {
    s.on('room:update', (data) => { alivePlayers = data.players; });

    s.on('game:role', (data) => {
      roles.set(i, data);
      console.log(`P${i + 1} role -> ${data.role} (${data.team})`);
    });

    s.on('game:teammates', (data) => {
      console.log(`P${i + 1} teammates:`, data.teammates.map(t => t.name).join(', ') || '(sendiri)');
    });

    s.on('thief:cards', (data) => {
      console.log(`P${i + 1} (Thief) lihat 2 kartu cadangan:`, data.cards);
      setTimeout(() => sockets[i].emit('thief:choice', { cardIndex: Math.random() < 0.5 ? 0 : 1 }), 200);
    });

    s.on('night:seerResult', (data) => console.log(`P${i + 1} (Seer) intip ${data.targetName} -> ${data.team}`));

    s.on('hunter:mustShoot', () => {
      const myId = playerIds[i];
      const target = aliveExcluding(myId)[0];
      if (target) {
        console.log(`P${i + 1} (Hunter) balas tembak ${target.name}`);
        sockets[i].emit('hunter:shoot', { targetId: target.id });
      }
    });

    s.on('lover:heartbreak', (data) => console.log('[lover:heartbreak]', data.name));
    s.on('cupid:loversAssigned', (data) => console.log(`P${i + 1} jadi sepasang kekasih dengan ${data.partnerName}`));

    s.on('phase:change', (data) => {
      console.log(`[phase:change] ${data.phase} (${data.timeLeft}s) round=${data.phase === 'Malam' ? '?' : ''}`);

      if (data.phase === 'Malam') {
        setTimeout(() => {
          const roleData = roles.get(i);
          const myId = playerIds[i];
          const isAlive = alivePlayers.find(p => p.id === myId)?.alive;
          if (!roleData || !isAlive) return;

          const role = roleData.role;
          const others = aliveExcluding(myId);
          if (!others.length) return;

          if (role === 'Werewolf' || role === 'Alpha Werewolf') {
            sockets[i].emit('night:action', { targetId: others[0].id });
          } else if (role === 'Guardian') {
            sockets[i].emit('night:action', { targetId: others[0].id });
          } else if (role === 'Seer') {
            sockets[i].emit('night:action', { targetId: others[others.length - 1].id });
          } else if (role === 'Vampire') {
            sockets[i].emit('night:action', { targetId: others[Math.floor(others.length / 2)].id });
          } else if (role === 'Witch') {
            // Coba heal orang pertama (kalau kena target werewolf, selamat), poison tidak dipakai (hemat)
            sockets[i].emit('night:action', { action: 'heal', targetId: others[0].id });
          } else if (role === 'Cupid') {
            if (others.length >= 2) sockets[i].emit('night:action', { targetId: others[0].id, targetIdB: others[1].id });
          } else if (role === 'Troublemaker') {
            if (others.length >= 2) sockets[i].emit('night:action', { targetId: others[0].id, targetIdB: others[1].id });
          }
        }, 400);
      }

      if (data.phase === 'Voting') {
        setTimeout(() => {
          const myId = playerIds[i];
          const isAlive = alivePlayers.find(p => p.id === myId)?.alive;
          if (!isAlive) return;
          const others = aliveExcluding(myId);
          if (others.length) sockets[i].emit('vote:cast', { targetId: others[0].id });
        }, 400);
      }
    });

    s.on('game:end', (data) => {
      console.log('=== GAME END === winner=', data.winner);
      data.players.forEach(p => console.log(`  ${p.name}: ${p.role} (${p.team}) - ${p.alive ? 'alive' : 'dead'}`));
      process.exit(0);
    });
  });

  sockets.forEach(s => s.emit('player:ready'));
  await new Promise(r => setTimeout(r, 400));
  host.emit('game:start', null, (res) => console.log('game:start ->', res));

  setTimeout(() => {
    console.log('TIMEOUT: game belum selesai dalam waktu wajar.');
    process.exit(1);
  }, 120000);
}

main().catch((err) => {
  console.error('SIMULATION ERROR:', err?.message || err);
  process.exit(1);
});
