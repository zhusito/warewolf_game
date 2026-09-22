// frontend/src/context/GameContext.jsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { socket } from '../socket';

const GameContext = createContext(null);

const LS_KEYS = {
  name: 'ww_playerName',
  roomCode: 'ww_roomCode',
  playerId: 'ww_playerId'
};

export function GameProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected);
  const [playerName, setPlayerNameState] = useState(() => localStorage.getItem(LS_KEYS.name) || '');

  // ---- Room / lobby ----
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem(LS_KEYS.roomCode) || null);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(LS_KEYS.playerId) || null);
  const [roomStatus, setRoomStatus] = useState('lobby'); // 'lobby' | 'in-progress' | 'ended'
  const [players, setPlayers] = useState([]); // dari room:update
  const [roomLimits, setRoomLimits] = useState({ minPlayers: 7, maxPlayers: 30 });
  const [joinError, setJoinError] = useState('');
  // Pesan buat user pas dia ke-kick host, atau ditinggal karena belum ready pas game mulai
  const [sessionNotice, setSessionNotice] = useState('');

  // ---- Game state ----
  const [myRole, setMyRole] = useState(null); // { role, team, description }
  const [teammates, setTeammates] = useState([]);
  const [phase, setPhase] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [lastNightResult, setLastNightResult] = useState(null); // { eliminated, poisoned }
  const [lastElimination, setLastElimination] = useState(undefined); // undefined = belum ada event masuk
  const [seerResult, setSeerResult] = useState(null);
  const [thiefCards, setThiefCards] = useState(null);
  const [loverPartner, setLoverPartner] = useState(null);
  const [hunterMustShoot, setHunterMustShoot] = useState(false);
  const [gameResult, setGameResult] = useState(null); // { winner, players }

  const persistSession = (code, id) => {
    setRoomCode(code);
    setPlayerId(id);
    localStorage.setItem(LS_KEYS.roomCode, code);
    localStorage.setItem(LS_KEYS.playerId, id);
  };

  const clearLocalGameState = () => {
    setRoomStatus('lobby');
    setPlayers([]);
    setMyRole(null);
    setTeammates([]);
    setPhase(null);
    setRound(0);
    setChatMessages([]);
    setLastNightResult(null);
    setLastElimination(undefined);
    setSeerResult(null);
    setThiefCards(null);
    setLoverPartner(null);
    setHunterMustShoot(false);
    setGameResult(null);
  };

  // ---- Setup listener sekali di awal ----
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onRoomUpdate = (data) => {
      setRoomCode(data.code);
      setRoomStatus(data.status);
      setPlayers(data.players);
      setRoomLimits({ minPlayers: data.minPlayers, maxPlayers: data.maxPlayers });
    };
    const onRole = (data) => setMyRole(data);
    const onTeammates = (data) => setTeammates(data.teammates);
    const onPhaseChange = (data) => {
      setPhase(data.phase);
      setTimeLeft(data.timeLeft);
      setRound(data.round ?? 0);
      if (data.phase === 'Malam') {
        setLastElimination(undefined);
        setSeerResult(null);
        setHunterMustShoot(false);
      }
    };
    const onPhaseTick = (data) => setTimeLeft(data.timeLeft);
    const onChatMessage = (msg) => setChatMessages((prev) => [...prev, msg]);
    const onNightResult = (data) => setLastNightResult(data);
    const onEliminationReveal = (data) => setLastElimination(data);
    const onSeerResult = (data) => setSeerResult(data);
    const onThiefCards = (data) => setThiefCards(data.cards);
    const onLoversAssigned = (data) => setLoverPartner(data.partnerName);
    const onHunterMustShoot = () => setHunterMustShoot(true);
    const onGameEnd = (data) => {
      setGameResult(data);
      setRoomStatus('ended');
    };

    // Di-kick host, atau ditinggal karena belum ready pas game mulai —
    // dua-duanya berujung sama: sesi lokal dibersihkan & tampilkan pesan.
    const onRoomKicked = (data) => {
      setSessionNotice(data?.message || 'Kamu dikeluarkan dari room.');
      localStorage.removeItem(LS_KEYS.roomCode);
      localStorage.removeItem(LS_KEYS.playerId);
      setRoomCode(null);
      setPlayerId(null);
      clearLocalGameState();
    };
    const onRoomLeftBehind = (data) => {
      setSessionNotice(data?.message || 'Kamu ditinggal karena belum ready.');
      localStorage.removeItem(LS_KEYS.roomCode);
      localStorage.removeItem(LS_KEYS.playerId);
      setRoomCode(null);
      setPlayerId(null);
      clearLocalGameState();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:update', onRoomUpdate);
    socket.on('game:role', onRole);
    socket.on('game:teammates', onTeammates);
    socket.on('phase:change', onPhaseChange);
    socket.on('phase:tick', onPhaseTick);
    socket.on('chat:message', onChatMessage);
    socket.on('night:result', onNightResult);
    socket.on('elimination:reveal', onEliminationReveal);
    socket.on('night:seerResult', onSeerResult);
    socket.on('thief:cards', onThiefCards);
    socket.on('cupid:loversAssigned', onLoversAssigned);
    socket.on('hunter:mustShoot', onHunterMustShoot);
    socket.on('game:end', onGameEnd);
    socket.on('room:kicked', onRoomKicked);
    socket.on('room:leftBehind', onRoomLeftBehind);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:update', onRoomUpdate);
      socket.off('game:role', onRole);
      socket.off('game:teammates', onTeammates);
      socket.off('phase:change', onPhaseChange);
      socket.off('phase:tick', onPhaseTick);
      socket.off('chat:message', onChatMessage);
      socket.off('night:result', onNightResult);
      socket.off('elimination:reveal', onEliminationReveal);
      socket.off('night:seerResult', onSeerResult);
      socket.off('thief:cards', onThiefCards);
      socket.off('cupid:loversAssigned', onLoversAssigned);
      socket.off('hunter:mustShoot', onHunterMustShoot);
      socket.off('game:end', onGameEnd);
      socket.off('room:kicked', onRoomKicked);
      socket.off('room:leftBehind', onRoomLeftBehind);
    };
  }, []);

  // ---- Coba rejoin otomatis kalau ada sesi tersimpan (refresh halaman) ----
  useEffect(() => {
    if (!connected || !roomCode || !playerId) return;
    socket.emit('room:rejoin', { roomCode, playerId }, (res) => {
      if (!res?.ok) {
        // Sesi sudah tidak valid (room dibubarkan, atau grace period disconnect sudah habis), bersihkan.
        localStorage.removeItem(LS_KEYS.roomCode);
        localStorage.removeItem(LS_KEYS.playerId);
        setRoomCode(null);
        setPlayerId(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  const setPlayerName = useCallback((name) => {
    setPlayerNameState(name);
    localStorage.setItem(LS_KEYS.name, name);
  }, []);

  const createRoom = useCallback((name) => {
    return new Promise((resolve) => {
      socket.emit('room:create', { playerName: name }, (res) => {
        if (res.ok) {
          persistSession(res.roomCode, res.playerId);
          setJoinError('');
        } else {
          setJoinError(res.error || 'Gagal membuat room.');
        }
        resolve(res);
      });
    });
  }, []);

  const joinRoom = useCallback((code, name) => {
    return new Promise((resolve) => {
      socket.emit('room:join', { roomCode: code, playerName: name }, (res) => {
        if (res.ok) {
          persistSession(res.roomCode, res.playerId);
          setJoinError('');
        } else {
          setJoinError(res.error || 'Gagal join room.');
        }
        resolve(res);
      });
    });
  }, []);

  // Keluar room SENGAJA (tombol "Leave Room"), beda dari cuma nutup tab/koneksi putus.
  // Kirim dulu ke server biar slotnya beneran kekosongin, baru bersihin state lokal.
  const leaveSession = useCallback(() => {
    socket.emit('room:leave');
    localStorage.removeItem(LS_KEYS.roomCode);
    localStorage.removeItem(LS_KEYS.playerId);
    setRoomCode(null);
    setPlayerId(null);
    clearLocalGameState();
  }, []);

  const clearSessionNotice = useCallback(() => setSessionNotice(''), []);

  const toggleReady = useCallback(() => socket.emit('player:ready'), []);

  const startGame = useCallback(() => {
    return new Promise((resolve) => {
      socket.emit('game:start', null, (res) => resolve(res));
    });
  }, []);

  const kickPlayer = useCallback((targetId) => {
    return new Promise((resolve) => {
      socket.emit('player:kick', { targetId }, (res) => resolve(res));
    });
  }, []);

  const sendChat = useCallback((text) => socket.emit('chat:send', { text }), []);
  const castVote = useCallback((targetId) => socket.emit('vote:cast', { targetId }), []);
  const submitNightAction = useCallback((payload) => socket.emit('night:action', payload), []);
  const submitThiefChoice = useCallback((cardIndex) => {
    socket.emit('thief:choice', { cardIndex });
    setThiefCards(null);
  }, []);
  const submitHunterShot = useCallback((targetId) => {
    setHunterMustShoot(false);
    socket.emit('hunter:shoot', { targetId });
  }, []);

  const me = players.find((p) => p.id === playerId) || null;
  const isHost = !!me && players.length > 0 && players.some((p) => p.id === playerId && p.isHost);

  const value = {
    connected,
    playerName, setPlayerName,
    roomCode, playerId,
    roomStatus, players, roomLimits, joinError,
    sessionNotice, clearSessionNotice,
    createRoom, joinRoom, leaveSession,
    toggleReady, startGame, kickPlayer,
    me, isHost,
    myRole, teammates,
    phase, timeLeft, round,
    chatMessages, sendChat,
    castVote,
    submitNightAction,
    thiefCards, submitThiefChoice,
    lastNightResult, lastElimination,
    seerResult, loverPartner,
    hunterMustShoot, submitHunterShot,
    gameResult
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame harus dipakai di dalam <GameProvider>');
  return ctx;
}