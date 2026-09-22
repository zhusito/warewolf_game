// backend/src/Room.js
import { ROLES, assignRoles } from './roles.js';

export const MIN_PLAYERS = 7;
export const MAX_PLAYERS = 30;

// Berapa lama (ms) kasih toleransi kalau koneksi seorang pemain putus pas masih
// di LOBBY (belum mulai game) sebelum dia beneran dihapus dari room. Ini yang
// nyelametin host/pemain dari "kelempar keluar sendiri" gara-gara wifi kedip
// sebentar atau HP dikunci.
export const DISCONNECT_GRACE_MS = 20000; // 20 detik

// Durasi tiap fase (detik). Sesuaikan saja kalau mau samakan dengan timer di frontend.
// Set env FAST_PHASES=1 untuk mempercepat durasi (dipakai saat testing/simulasi).
const FAST = process.env.FAST_PHASES === '1';
const PHASE_DURATION = FAST
  ? { Malam: 4, Diskusi: 3, Voting: 3, Elimination: 2 }
  : { Malam: 45, Diskusi: 60, Voting: 30, Elimination: 8 };

const WEREWOLF_TEAM_ROLES = new Set(['WEREWOLF', 'ALPHA_WEREWOLF']);

export class Room {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.hostId = null;
    this.players = new Map(); // playerId -> player object (lihat addPlayer)
    this.status = 'lobby'; // 'lobby' | 'in-progress' | 'ended'

    this.phase = null; // 'Malam' | 'Diskusi' | 'Voting' | 'Elimination'
    this.timeLeft = 0;
    this.timerHandle = null;
    this.round = 0; // sudah malam ke berapa

    this.votes = new Map(); // voterId -> targetId
    this.nightActions = {}; // dikumpulkan ulang tiap malam, lihat startPhase()
    this.extraCards = []; // 2 role cadangan untuk Thief (kalau ada)

    this.chat = [];

    // playerId -> timer setTimeout, buat grace period disconnect di lobby
    this.disconnectTimers = new Map();
  }

  // ---------- Room / lobby management ----------

  addPlayer(playerId, name, socketId) {
    if (this.status !== 'lobby') {
      throw new Error('Game sudah dimulai, tidak bisa join.');
    }
    if (this.players.size >= MAX_PLAYERS) {
      throw new Error('Room sudah penuh.');
    }
    if (!this.hostId) this.hostId = playerId;

    this.players.set(playerId, {
      id: playerId,
      name,
      socketId,
      ready: false,
      alive: true,
      role: null,
      connected: true,
      loverOf: null,
      extraLife: false, // Strong Villager
      witchHealUsed: false,
      witchPoisonUsed: false,
      hunterShotUsed: false
    });
    this.broadcastRoomUpdate();
  }

  removePlayer(playerId) {
    this.cancelRemoval(playerId);
    this.players.delete(playerId);
    if (this.hostId === playerId) {
      const next = this.players.keys().next();
      this.hostId = next.done ? null : next.value;
    }
    this.broadcastRoomUpdate();
  }

  // Dipanggil host lewat event 'player:kick'. Melempar Error kalau tidak sah.
  // Return socketId pemain yang di-kick, biar server.js bisa lepas dia dari grup socket.io.
  kickPlayer(requesterId, targetId) {
    if (requesterId !== this.hostId) {
      throw new Error('Cuma host yang bisa nge-kick pemain.');
    }
    if (requesterId === targetId) {
      throw new Error('Tidak bisa kick diri sendiri.');
    }
    const target = this.players.get(targetId);
    if (!target) {
      throw new Error('Pemain tidak ditemukan.');
    }

    this.emitToPlayer(targetId, 'room:kicked', {
      message: 'Kamu dikeluarkan dari room oleh host.'
    });

    const socketId = target.socketId;
    this.removePlayer(targetId);
    return socketId;
  }

  // Koneksi socket seorang pemain putus. Kalau masih di lobby, kasih grace period
  // dulu (jangan langsung dihapus) — biar refresh/wifi kedip sebentar tidak
  // langsung nendang dia keluar dari room.
  markDisconnected(playerId) {
    const p = this.players.get(playerId);
    if (!p) return;
    p.connected = false;
    this.broadcastRoomUpdate();

    if (this.status === 'lobby') {
      this.scheduleRemoval(playerId);
    }
    // Kalau status 'in-progress', sengaja TIDAK dihapus — biar dia bisa
    // room:rejoin kapan saja selama game masih berlangsung.
  }

  markReconnected(playerId, socketId) {
    const p = this.players.get(playerId);
    if (!p) return;
    this.cancelRemoval(playerId); // batalkan rencana penghapusan kalau sempat dijadwalkan
    p.connected = true;
    p.socketId = socketId;
    this.broadcastRoomUpdate();
  }

  scheduleRemoval(playerId) {
    this.cancelRemoval(playerId); // jangan sampai numpuk timer buat orang yang sama
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      const p = this.players.get(playerId);
      // Cek ulang: masih ada & masih beneran disconnected (bukan sudah reconnect lalu disconnect lagi barusan)
      if (p && !p.connected) {
        this.removePlayer(playerId);
      }
    }, DISCONNECT_GRACE_MS);
    this.disconnectTimers.set(playerId, timer);
  }

  cancelRemoval(playerId) {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  toggleReady(playerId) {
    const p = this.players.get(playerId);
    if (!p) return;
    p.ready = !p.ready;
    this.broadcastRoomUpdate();
  }

  isEmpty() {
    return this.players.size === 0;
  }

  // Syarat mulai: minimal MIN_PLAYERS yang READY (bukan semua orang di room harus ready).
  // Yang belum ready boleh tetap nangkring di lobby, dan akan ditinggal otomatis
  // begitu host menekan "Mulai Game" (lihat startGame()).
  canStart() {
    const players = [...this.players.values()];
    const readyCount = players.filter(p => p.ready).length;
    return this.status === 'lobby' && readyCount >= MIN_PLAYERS;
  }

  toPublicPlayerList() {
    return [...this.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      alive: p.alive,
      isHost: p.id === this.hostId,
      connected: p.connected
    }));
  }

  broadcastRoomUpdate() {
    this.io.to(this.code).emit('room:update', {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      players: this.toPublicPlayerList(),
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS
    });
  }

  emitToPlayer(playerId, event, payload) {
    const p = this.players.get(playerId);
    if (!p) return;
    const socket = this.io.sockets.sockets.get(p.socketId);
    socket?.emit(event, payload);
  }

  // ---------- Chat ----------

  sendChat(playerId, text) {
    const p = this.players.get(playerId);
    if (!p || !p.alive) return;
    if (this.phase === 'Malam') return; // sesuai frontend: chat dikunci saat Malam

    const msg = {
      id: Date.now() + Math.random(),
      sender: p.name,
      senderId: p.id,
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isSystem: false
    };
    this.chat.push(msg);
    this.io.to(this.code).emit('chat:message', msg);
  }

  systemMessage(text) {
    const msg = {
      id: Date.now() + Math.random(),
      sender: 'System',
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    };
    this.chat.push(msg);
    this.io.to(this.code).emit('chat:message', msg);
  }

  // ---------- Game start ----------

  startGame() {
    if (!this.canStart()) throw new Error('Syarat mulai game belum terpenuhi.');

    // Pemain yang belum ready DITINGGAL (dikeluarkan) sebelum role dibagikan.
    const notReady = [...this.players.values()].filter(p => !p.ready);
    notReady.forEach((p) => {
      this.emitToPlayer(p.id, 'room:leftBehind', {
        message: 'Kamu ditinggal karena belum ready saat host memulai game.'
      });
      this.removePlayer(p.id);
    });

    this.status = 'in-progress';
    const playerIds = [...this.players.keys()];
    const { assignment, extraCards } = assignRoles(playerIds);
    this.extraCards = extraCards;

    for (const [playerId, roleKey] of assignment) {
      const p = this.players.get(playerId);
      p.role = roleKey;
      p.alive = true;
      p.extraLife = roleKey === 'STRONG_VILLAGER';

      this.emitToPlayer(playerId, 'game:role', {
        role: ROLES[roleKey].name,
        team: ROLES[roleKey].team,
        description: ROLES[roleKey].description
      });

      if (roleKey === 'THIEF' && extraCards.length === 2) {
        this.emitToPlayer(playerId, 'thief:cards', {
          cards: extraCards.map(key => ROLES[key].name)
        });
      }
    }

    this.broadcastTeammates(WEREWOLF_TEAM_ROLES);
    this.broadcastTeammates(new Set(['VAMPIRE']));

    this.broadcastRoomUpdate();
    this.startPhase('Malam');
  }

  // Kasih tahu tiap anggota tim (Werewolf/Alpha, atau Vampire) siapa saja rekan satu timnya.
  broadcastTeammates(roleSet) {
    const members = [...this.players.values()].filter(p => roleSet.has(p.role));
    if (members.length === 0) return;
    const list = members.map(p => ({ id: p.id, name: p.name, role: ROLES[p.role].name }));
    members.forEach(p => {
      this.emitToPlayer(p.id, 'game:teammates', { teammates: list.filter(m => m.id !== p.id) });
    });
  }

  // ---------- Fase & timer ----------

  startPhase(phase) {
    this.phase = phase;
    this.timeLeft = PHASE_DURATION[phase];
    this.votes = new Map();

    if (phase === 'Malam') {
      this.round += 1;
      this.nightActions = {
        werewolfVotes: new Map(), // playerId(werewolf) -> targetId
        guardian: null,
        seer: null,
        vampire: null,
        witchHeal: null,
        witchPoison: null,
        cupid: null, // { a, b } — hanya round 1
        troublemaker: null, // { a, b } — hanya round 1
        thiefChoice: null // roleKey pilihan thief — hanya round 1
      };
    }

    this.io.to(this.code).emit('phase:change', { phase: this.phase, timeLeft: this.timeLeft, round: this.round });

    if (phase === 'Diskusi') {
      this.systemMessage('Waktunya diskusi! Siapa yang kamu curigai?');
    } else if (phase === 'Voting') {
      this.systemMessage('Waktu diskusi habis. Silakan lakukan Voting!');
    } else if (phase === 'Malam') {
      this.systemMessage(this.round === 1 ? 'Malam pertama tiba. Semua pemain tertidur.' : 'Malam tiba. Semua pemain tertidur.');
    }

    clearInterval(this.timerHandle);
    this.timerHandle = setInterval(() => this.tick(), 1000);
  }

  tick() {
    this.timeLeft -= 1;
    this.io.to(this.code).emit('phase:tick', { timeLeft: this.timeLeft });

    if (this.timeLeft <= 0) {
      clearInterval(this.timerHandle);
      this.onPhaseEnd();
    }
  }

  onPhaseEnd() {
    if (this.phase === 'Malam') {
      this.resolveNight();
    } else if (this.phase === 'Diskusi') {
      this.startPhase('Voting');
    } else if (this.phase === 'Voting') {
      this.resolveVote();
    } else if (this.phase === 'Elimination') {
      const result = this.checkWinCondition();
      if (result) {
        this.endGame(result);
      } else {
        this.startPhase('Malam');
      }
    }
  }

  // ---------- Night actions (submit dari client) ----------

  submitNightAction(playerId, payload = {}) {
    const p = this.players.get(playerId);
    if (!p || !p.alive || this.phase !== 'Malam') return;
    const { targetId, targetIdB, action } = payload;

    if (p.role === 'WEREWOLF' || p.role === 'ALPHA_WEREWOLF') {
      const target = this.players.get(targetId);
      if (target && target.alive) {
        this.nightActions.werewolfVotes.set(playerId, { targetId, isAlpha: p.role === 'ALPHA_WEREWOLF' });
      }
      return;
    }

    if (p.role === 'GUARDIAN') {
      const target = this.players.get(targetId);
      if (target && target.alive) this.nightActions.guardian = targetId;
      return;
    }

    if (p.role === 'VAMPIRE') {
      const target = this.players.get(targetId);
      if (target && target.alive && target.role !== 'VAMPIRE') this.nightActions.vampire = targetId;
      return;
    }

    if (p.role === 'SEER') {
      const target = this.players.get(targetId);
      if (!target) return;
      this.nightActions.seer = targetId;
      const appearsWerewolf = ROLES[target.role].team === 'werewolf' || !!ROLES[target.role].appearsAsWerewolf;
      this.emitToPlayer(playerId, 'night:seerResult', {
        targetId,
        targetName: target.name,
        team: appearsWerewolf ? 'werewolf' : 'villager'
      });
      return;
    }

    if (p.role === 'WITCH') {
      if (action === 'heal' && !p.witchHealUsed) {
        this.nightActions.witchHeal = targetId;
      } else if (action === 'poison' && !p.witchPoisonUsed) {
        const target = this.players.get(targetId);
        if (target && target.alive) this.nightActions.witchPoison = targetId;
      }
      return;
    }

    if (p.role === 'CUPID' && ROLES.CUPID.nightOnce && this.round === 1 && !this.nightActions.cupid) {
      const a = this.players.get(targetId);
      const b = this.players.get(targetIdB);
      if (a && b && a.id !== b.id) this.nightActions.cupid = { a: a.id, b: b.id };
      return;
    }

    if (p.role === 'TROUBLEMAKER' && this.round === 1 && !this.nightActions.troublemaker) {
      const a = this.players.get(targetId);
      const b = this.players.get(targetIdB);
      if (a && b && a.id !== b.id && a.id !== playerId && b.id !== playerId) {
        this.nightActions.troublemaker = { a: a.id, b: b.id };
      }
      return;
    }
  }

  submitThiefChoice(playerId, cardIndex) {
    const p = this.players.get(playerId);
    if (!p || p.role !== 'THIEF' || this.round !== 1 || this.phase !== 'Malam') return;
    if (cardIndex !== 0 && cardIndex !== 1) return;
    this.nightActions.thiefChoice = this.extraCards[cardIndex];
  }

  submitHunterShot(playerId, targetId) {
    const p = this.players.get(playerId);
    const target = this.players.get(targetId);
    if (!p || p.role !== 'HUNTER' || p.alive) return; // hanya berlaku setelah Hunter mati
    if (!target || !target.alive) return;
    if (p.hunterShotUsed) return;
    p.hunterShotUsed = true;

    target.alive = false;
    this.systemMessage(`${p.name} (Hunter) menembak ${target.name} sebelum tumbang!`);
    this.io.to(this.code).emit('hunter:shotResult', { shooterId: p.id, targetId: target.id, targetName: target.name });
    this.handleChainDeath(target.id);
    this.broadcastRoomUpdate();
  }

  // ---------- Resolusi Malam ----------

  resolveNight() {
    // 1) Thief: swap role kalau ada pilihan.
    if (this.nightActions.thiefChoice) {
      const thief = [...this.players.values()].find(pl => pl.role === 'THIEF');
      if (thief) {
        thief.role = this.nightActions.thiefChoice;
        thief.extraLife = thief.role === 'STRONG_VILLAGER';
        this.emitToPlayer(thief.id, 'game:role', {
          role: ROLES[thief.role].name,
          team: ROLES[thief.role].team,
          description: ROLES[thief.role].description
        });
      }
    }

    // 2) Troublemaker: tukar role dua pemain lain (diam-diam).
    if (this.nightActions.troublemaker) {
      const { a, b } = this.nightActions.troublemaker;
      const pa = this.players.get(a);
      const pb = this.players.get(b);
      if (pa && pb) {
        [pa.role, pb.role] = [pb.role, pa.role];
        [pa.extraLife, pb.extraLife] = [pa.role === 'STRONG_VILLAGER', pb.role === 'STRONG_VILLAGER'];
        for (const pl of [pa, pb]) {
          this.emitToPlayer(pl.id, 'game:role', {
            role: ROLES[pl.role].name,
            team: ROLES[pl.role].team,
            description: ROLES[pl.role].description
          });
        }
        this.systemMessage('Troublemaker telah menukar role dua pemain secara diam-diam...');
      }
    }

    // 3) Cupid: tandai sepasang kekasih.
    if (this.nightActions.cupid) {
      const { a, b } = this.nightActions.cupid;
      const pa = this.players.get(a);
      const pb = this.players.get(b);
      if (pa && pb) {
        pa.loverOf = b;
        pb.loverOf = a;
        this.emitToPlayer(a, 'cupid:loversAssigned', { partnerId: b, partnerName: pb.name });
        this.emitToPlayer(b, 'cupid:loversAssigned', { partnerId: a, partnerName: pa.name });
        this.systemMessage('Cupid telah memanah dua hati malam ini...');
      }
    }

    // 4) Werewolf: tentukan target (mayoritas suara; Alpha jadi penentu kalau seri).
    const votes = [...this.nightActions.werewolfVotes.values()];
    let werewolfTarget = null;
    if (votes.length > 0) {
      const tally = new Map();
      votes.forEach(v => tally.set(v.targetId, (tally.get(v.targetId) || 0) + 1));
      let max = 0;
      for (const [targetId, count] of tally) {
        if (count > max) { max = count; werewolfTarget = targetId; }
      }
      const alphaVote = votes.find(v => v.isAlpha);
      const isTie = [...tally.values()].filter(c => c === max).length > 1;
      if (isTie && alphaVote) werewolfTarget = alphaVote.targetId;
    }

    // 5) Vampire: konversi target jadi Vampire (tidak membunuh).
    if (this.nightActions.vampire) {
      const target = this.players.get(this.nightActions.vampire);
      if (target && target.alive) {
        target.role = 'VAMPIRE';
        this.emitToPlayer(target.id, 'game:role', {
          role: ROLES.VAMPIRE.name,
          team: ROLES.VAMPIRE.team,
          description: ROLES.VAMPIRE.description
        });
        this.systemMessage(`${target.name} menghilang sesaat malam ini... (sesuatu yang gelap telah terjadi)`);
      }
    }

    // 6) Resolusi serangan Werewolf: Guardian > Strong Villager (nyawa cadangan) > Cursed (berubah, bukan mati) > Witch heal > mati.
    let nightVictim = null;
    let curseTriggered = false;

    if (werewolfTarget) {
      const target = this.players.get(werewolfTarget);
      const protectedByGuardian = this.nightActions.guardian === werewolfTarget;
      const savedByWitch = this.nightActions.witchHeal === werewolfTarget;

      if (target && target.alive && !protectedByGuardian && !savedByWitch) {
        if (target.role === 'CURSED') {
          target.role = 'WEREWOLF';
          curseTriggered = true;
          this.emitToPlayer(target.id, 'game:role', {
            role: ROLES.WEREWOLF.name,
            team: ROLES.WEREWOLF.team,
            description: 'Kutukan bangkit! Kamu sekarang adalah Werewolf.'
          });
          this.systemMessage(`${target.name} diserang Werewolf... tapi malah berubah menjadi salah satu dari mereka!`);
        } else if (target.extraLife) {
          target.extraLife = false;
          this.systemMessage(`${target.name} diserang Werewolf tapi berhasil bertahan hidup!`);
        } else {
          target.alive = false;
          nightVictim = target;
        }
      }
    }

    // 7) Witch poison: bunuh target terpisah dari serangan werewolf (bypass Guardian).
    let poisonVictim = null;
    if (this.nightActions.witchPoison) {
      const target = this.players.get(this.nightActions.witchPoison);
      if (target && target.alive) {
        target.alive = false;
        poisonVictim = target;
      }
    }

    // Tandai potion witch terpakai (baik dipakai atau tidak, hanya kalau memang disubmit).
    const witch = [...this.players.values()].find(pl => pl.role === 'WITCH');
    if (witch) {
      if (this.nightActions.witchHeal) witch.witchHealUsed = true;
      if (this.nightActions.witchPoison) witch.witchPoisonUsed = true;
    }

    // 8) Umumkan hasil malam.
    if (nightVictim) {
      this.systemMessage(`${nightVictim.name} ditemukan tewas pada pagi hari.`);
    } else if (!curseTriggered) {
      this.systemMessage('Tidak ada korban serangan Werewolf malam ini.');
    }
    if (poisonVictim) {
      this.systemMessage(`${poisonVictim.name} ditemukan tewas akibat racun misterius.`);
    }

    this.io.to(this.code).emit('night:result', {
      eliminated: nightVictim ? { id: nightVictim.id, name: nightVictim.name, role: ROLES[nightVictim.role].name } : null,
      poisoned: poisonVictim ? { id: poisonVictim.id, name: poisonVictim.name, role: ROLES[poisonVictim.role].name } : null
    });

    // 9) Efek berantai (Hunter revenge window & Lover heartbreak) untuk korban malam ini.
    if (nightVictim) this.handleChainDeath(nightVictim.id, { grantHunterWindow: true });
    if (poisonVictim) this.handleChainDeath(poisonVictim.id, { grantHunterWindow: true });

    // Susunan tim bisa berubah (Cursed jadi Werewolf, target jadi Vampire, Thief/Troublemaker swap) — kabari ulang.
    this.broadcastTeammates(WEREWOLF_TEAM_ROLES);
    this.broadcastTeammates(new Set(['VAMPIRE']));

    this.broadcastRoomUpdate();

    const result = this.checkWinCondition();
    if (result) {
      this.endGame(result);
    } else {
      this.startPhase('Diskusi');
    }
  }

  /**
   * Dipanggil tiap kali ada pemain yang mati (malam ATAU voting), supaya efek
   * berantai (pasangan Cupid ikut mati, kesempatan tembak Hunter) konsisten di semua jalur.
   */
  handleChainDeath(deadPlayerId, { grantHunterWindow = false } = {}) {
    const dead = this.players.get(deadPlayerId);
    if (!dead) return;

    // Lover heartbreak: kalau pasangannya masih hidup, ikut mati.
    if (dead.loverOf) {
      const partner = this.players.get(dead.loverOf);
      if (partner && partner.alive) {
        partner.alive = false;
        this.systemMessage(`${partner.name} tak sanggup hidup tanpa ${dead.name} dan ikut gugur karena patah hati.`);
        this.io.to(this.code).emit('lover:heartbreak', { id: partner.id, name: partner.name });
        this.handleChainDeath(partner.id, { grantHunterWindow });
      }
    }

    // Hunter revenge: beri kesempatan (event khusus), tidak menghentikan timer fase.
    if (grantHunterWindow && dead.role === 'HUNTER' && !dead.hunterShotUsed) {
      this.emitToPlayer(dead.id, 'hunter:mustShoot', {
        message: 'Kamu Hunter dan baru saja mati! Cepat pilih satu pemain untuk ditembak sebelum fase berganti (kirim event hunter:shoot).'
      });
    }
  }

  // ---------- Voting ----------

  castVote(voterId, targetId) {
    const voter = this.players.get(voterId);
    const target = this.players.get(targetId);
    if (!voter || !voter.alive || this.phase !== 'Voting') return;
    if (!target || !target.alive) return;
    if (voterId === targetId) return;

    this.votes.set(voterId, targetId);
    this.io.to(this.code).emit('vote:update', {
      voteCount: this.votes.size,
      aliveCount: [...this.players.values()].filter(p => p.alive).length
    });

    const aliveCount = [...this.players.values()].filter(p => p.alive).length;
    if (this.votes.size >= aliveCount) {
      clearInterval(this.timerHandle);
      this.resolveVote();
    }
  }

  resolveVote() {
    // King: suaranya dihitung dobel.
    const tally = new Map();
    for (const [voterId, targetId] of this.votes) {
      const voter = this.players.get(voterId);
      const weight = voter?.role === 'KING' ? 2 : 1;
      tally.set(targetId, (tally.get(targetId) || 0) + weight);
    }

    let eliminatedId = null;
    let maxVotes = 0;
    let tie = false;
    for (const [targetId, count] of tally) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = targetId;
        tie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        tie = true;
      }
    }
    if (tie) eliminatedId = null; // suara seri -> tidak ada yang tereliminasi

    let eliminatedPlayer = null;
    if (eliminatedId) {
      eliminatedPlayer = this.players.get(eliminatedId);
      if (eliminatedPlayer) eliminatedPlayer.alive = false;
    }

    this.phase = 'Elimination';
    this.timeLeft = PHASE_DURATION.Elimination;
    this.io.to(this.code).emit('phase:change', { phase: this.phase, timeLeft: this.timeLeft, round: this.round });

    if (eliminatedPlayer) {
      this.io.to(this.code).emit('elimination:reveal', {
        id: eliminatedPlayer.id,
        name: eliminatedPlayer.name,
        role: ROLES[eliminatedPlayer.role].name,
        isWerewolf: WEREWOLF_TEAM_ROLES.has(eliminatedPlayer.role)
      });
      this.handleChainDeath(eliminatedPlayer.id, { grantHunterWindow: true });
    } else {
      this.io.to(this.code).emit('elimination:reveal', null);
    }

    this.broadcastRoomUpdate();

    clearInterval(this.timerHandle);
    this.timerHandle = setInterval(() => this.tick(), 1000);
  }

  // ---------- Win condition & ending ----------

  checkWinCondition() {
    const alivePlayers = [...this.players.values()].filter(p => p.alive);

    // Sepasang lover yang jadi 2 orang terakhir menang bersama, apapun tim aslinya.
    if (alivePlayers.length === 2) {
      const [p1, p2] = alivePlayers;
      if (p1.loverOf === p2.id && p2.loverOf === p1.id) return 'lovers';
    }

    const aliveWerewolves = alivePlayers.filter(p => WEREWOLF_TEAM_ROLES.has(p.role)).length;
    const aliveVampires = alivePlayers.filter(p => p.role === 'VAMPIRE').length;
    const aliveVillagers = alivePlayers.length - aliveWerewolves - aliveVampires;

    if (aliveVampires > 0 && aliveVampires >= aliveWerewolves + aliveVillagers) return 'vampires';
    if (aliveWerewolves === 0 && aliveVampires === 0) return 'villagers';
    if (aliveWerewolves > 0 && aliveWerewolves >= aliveVillagers + aliveVampires) return 'werewolves';

    return null;
  }

  endGame(winner) {
    clearInterval(this.timerHandle);
    this.status = 'ended';
    this.phase = null;

    const players = [...this.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      role: ROLES[p.role].name,
      team: ROLES[p.role].team,
      alive: p.alive
    }));

    this.io.to(this.code).emit('game:end', { winner, players });
    this.broadcastRoomUpdate();
  }

  destroy() {
    clearInterval(this.timerHandle);
    for (const timer of this.disconnectTimers.values()) clearTimeout(timer);
    this.disconnectTimers.clear();
  }
}