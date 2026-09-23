import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getRoleImage } from '../roleImages';
import { playRevealSound, playEliminationSound, playBGM } from '../utils/soundManager';

const NIGHT_ACTION_ROLES = ['Werewolf', 'Alpha Werewolf', 'Vampire', 'Guardian', 'Seer', 'Witch', 'Cupid', 'Troublemaker'];

export default function GameArea() {
  const navigate = useNavigate();
  const {
    playerId, players, myRole, teammates, phase, timeLeft, round,
    chatMessages, sendChat, castVote, submitNightAction,
    thiefCards, submitThiefChoice,
    lastElimination, seerResult, loverPartner,
    hunterMustShoot, submitHunterShot,
    gameResult, roomCode
  } = useGame();

  const [showRolePopup, setShowRolePopup] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [showVoteDrawer, setShowVoteDrawer] = useState(false);
  const [showNightDrawer, setShowNightDrawer] = useState(false);
  const [votedPlayer, setVotedPlayer] = useState(null);
  const [nightSubmitted, setNightSubmitted] = useState(false);
  const [nightPickA, setNightPickA] = useState(null); // dipakai untuk aksi 2-target (Cupid/Troublemaker)
  const [seerResultDismissed, setSeerResultDismissed] = useState(true);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const me = players.find(p => p.id === playerId);
  const roleName = myRole?.role;
  const roleImage = getRoleImage(roleName);
  const isEvilTeam = myRole?.team === 'werewolf' || myRole?.team === 'vampire';
  const chatLocked = phase === 'Malam' && !isEvilTeam;

  const alivePlayersExceptMe = useMemo(
    () => players.filter(p => p.alive && p.id !== playerId),
    [players, playerId]
  );

  // Redirect kalau tidak ada sesi room aktif
  useEffect(() => {
    if (!roomCode) navigate('/home');
  }, [roomCode, navigate]);

  // Pindah ke halaman hasil begitu game selesai
  useEffect(() => {
    if (gameResult) navigate('/result');
  }, [gameResult, navigate]);

  useEffect(() => {
    playBGM(phase === 'Malam' ? 'game-malam' : 'game-siang');
  }, [phase]);

  useEffect(() => {
    if (!showRolePopup) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showRolePopup]);

  // Reset state per-malam
  useEffect(() => {
    if (phase === 'Malam') {
      setNightSubmitted(false);
      setNightPickA(null);
      setVotedPlayer(null);
      setSeerResultDismissed(true);
      setShowNightDrawer(NIGHT_ACTION_ROLES.includes(roleName) && (round === 1 || !['Cupid', 'Troublemaker'].includes(roleName)));
    } else {
      setShowNightDrawer(false);
    }
    if (phase === 'Voting') setShowVoteDrawer(true);
  }, [phase, round, roleName]);

  // Begitu hasil intip Seer baru datang dari server, munculkan popup-nya
  useEffect(() => {
    if (seerResult) setSeerResultDismissed(false);
  }, [seerResult]);

  const handleStartChat = () => setShowRolePopup(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChat(inputText.trim());
    setInputText('');
  };

  const handleVote = (targetId) => {
    setVotedPlayer(targetId);
    castVote(targetId);
    setTimeout(() => setShowVoteDrawer(false), 500);
  };

  // ---- Aksi malam, disesuaikan per role ----
  const handleSingleTargetNightAction = (targetId) => {
    if (roleName === 'Witch') return; // Witch pakai tombol ramuan sendiri, bukan target langsung
    submitNightAction({ targetId });
    setNightSubmitted(true);
    setTimeout(() => setShowNightDrawer(false), 400);
  };

  const handleWitchHeal = (targetId) => {
    submitNightAction({ action: 'heal', targetId });
    setNightSubmitted(true);
  };
  const handleWitchPoison = (targetId) => {
    submitNightAction({ action: 'poison', targetId });
    setNightSubmitted(true);
  };

  const handleTwoTargetPick = (targetId) => {
    if (!nightPickA) {
      setNightPickA(targetId);
      return;
    }
    if (targetId === nightPickA) return; // tidak boleh pilih orang yang sama dua kali
    submitNightAction({ targetId: nightPickA, targetIdB: targetId });
    setNightSubmitted(true);
    setTimeout(() => setShowNightDrawer(false), 400);
  };

  const nightActionTitle = {
    'Werewolf': 'Pilih Mangsa 🐺',
    'Alpha Werewolf': 'Pilih Mangsa (Suaramu Penentu) 🐺',
    'Vampire': 'Pilih Target untuk Digigit 🦇',
    'Guardian': 'Pilih Pemain untuk Dilindungi 🛡️',
    'Seer': 'Pilih Pemain untuk Diintip 🔮',
    'Witch': 'Ramuan Witch 🧪',
    'Cupid': !nightPickA ? 'Pilih Kekasih Pertama 💘' : 'Pilih Kekasih Kedua 💘',
    'Troublemaker': !nightPickA ? 'Pilih Pemain Pertama untuk Ditukar 🔀' : 'Pilih Pemain Kedua untuk Ditukar 🔀'
  }[roleName] || 'Aksi Malam';

  const renderRoleCardModal = () => (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 className="role-reveal-title" style={{ color: 'white', marginBottom: '30px', textShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }}>
          Identitas Kamu
        </h2>

        {!myRole ? (
          <p style={{ color: 'white' }}>Menunggu pembagian role...</p>
        ) : (
          <>
            <div className="card-scene" onClick={() => {
              if (!isFlipped) {
                setIsFlipped(true);
                playRevealSound(myRole.team === 'werewolf');
              }
            }}>
              <div className={`card-object ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="aura"></div>
                <div className="card-face card-front">
                  <div className="pulse-icon" style={{ fontSize: '4rem', marginBottom: '16px' }}>🐺</div>
                  <h3 style={{ margin: 0, letterSpacing: '2px' }}>WEREWOLF MBTI</h3>
                  <p style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.8 }}>Sentuh kartu untuk membuka</p>
                </div>
                <div className="card-face card-back" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'transparent' }}>
                  <img src={roleImage} alt={myRole.role} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                  <div className="shimmer-overlay"></div>
                </div>
              </div>
            </div>

            {isFlipped && (
              <>
                <h3 style={{ color: 'white', marginTop: '20px' }}>{myRole.role}</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', maxWidth: '320px', fontSize: '0.9rem' }}>
                  {myRole.description}
                </p>
                {teammates.length > 0 && (
                  <p style={{ color: '#FCA5A5', marginTop: '10px', fontSize: '0.85rem' }}>
                    Rekan satu timmu: {teammates.map(t => t.name).join(', ')}
                  </p>
                )}
                {loverPartner && (
                  <p style={{ color: '#F9A8D4', marginTop: '10px', fontSize: '0.85rem' }}>
                    💘 Kamu sepasang kekasih dengan {loverPartner}
                  </p>
                )}
                <button
                  onClick={handleStartChat}
                  className="btn btn-primary animate-slide-up"
                  style={{ marginTop: '30px', width: '280px' }}
                >
                  Tutup & Kembali ke Chat
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (lastElimination !== undefined) playEliminationSound();
  }, [lastElimination]);

  return (
    <div className="animate-fade-in" style={{
      width: 'calc(100% + 40px)', height: '100vh', maxHeight: '100dvh', display: 'flex', flexDirection: 'column',
      margin: '-20px -20px -20px -20px', background: '#0B0F19', overflow: 'hidden'
    }}>

      {/* Elimination Reveal Modal */}
      {phase === 'Elimination' && (
        <div className="win-overlay" style={{ background: '#000000', zIndex: 1500 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px' }}>
            {lastElimination ? (
              <>
                <div style={{ marginBottom: '30px', animation: 'float 4s ease-in-out infinite' }}>
                  <img src={getRoleImage(lastElimination.role)} alt={lastElimination.role}
                    style={{ width: '220px', height: '320px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }} />
                </div>
                <h2 className="animate-slide-up" style={{ color: 'white', textAlign: 'center', letterSpacing: '2px', lineHeight: '1.5' }}>
                  {lastElimination.name} dikeluarkan.
                </h2>
                <p style={{ fontSize: '1.3rem', marginTop: '16px', color: lastElimination.isWerewolf ? 'var(--danger-color)' : 'var(--primary-color)', fontWeight: 'bold' }}>
                  {lastElimination.name} adalah {lastElimination.role}
                </p>
              </>
            ) : (
              <h2 style={{ color: 'white' }}>Suara seri, tidak ada yang dikeluarkan.</h2>
            )}
          </div>
        </div>
      )}

      {/* Hunter revenge shot modal */}
      {hunterMustShoot && (
        <div className="drawer-overlay" style={{ zIndex: 1600 }}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ margin: 0, color: 'var(--danger-color)' }}>Kamu Hunter! Tembak satu orang 🎯</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.filter(p => p.alive && p.id !== playerId).map(p => (
                <button key={p.id} className="btn btn-primary" style={{ width: '100%' }} onClick={() => submitHunterShot(p.id)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hasil intip Seer — popup terpisah, tidak ketutup pas drawer aksi malam nutup */}
      {roleName === 'Seer' && seerResult && !seerResultDismissed && (
        <div className="drawer-overlay" style={{ zIndex: 1550 }} onClick={() => setSeerResultDismissed(true)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header"><h3 style={{ margin: 0 }}>🔮 Hasil Intip Seer</h3></div>
            <p style={{ fontSize: '1rem', color: 'white', lineHeight: '1.6' }}>
              <strong>{seerResult.targetName}</strong> adalah{' '}
              <strong style={{ color: seerResult.team === 'werewolf' ? 'var(--danger-color)' : '#6EE7B7' }}>
                {seerResult.team === 'werewolf' ? 'Werewolf 🐺' : 'Villager 🧑‍🌾'}
              </strong>
            </p>
            <button className="btn btn-primary" onClick={() => setSeerResultDismissed(true)}>Oke, Mengerti</button>
          </div>
        </div>
      )}

      {/* Thief cards modal */}
      {thiefCards && (
        <div className="drawer-overlay" style={{ zIndex: 1600 }}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header"><h3 style={{ margin: 0 }}>Kartu Cadangan Thief 🃏</h3></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mau tukar role-mu jadi salah satu ini?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {thiefCards.map((card, idx) => (
                <button key={idx} className="btn btn-primary" onClick={() => submitThiefChoice(idx)}>
                  Tukar jadi {card}
                </button>
              ))}
              <button className="btn btn-secondary" onClick={() => submitThiefChoice(-1)}>Tidak, tetap jadi Thief</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Reveal Modal */}
      {showRolePopup && renderRoleCardModal()}

      {!showRolePopup && (
        <>
          {/* Header */}
          <div style={{
            background: '#1E293B', color: 'white', padding: '16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)', zIndex: 10
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {phase === 'Diskusi' ? 'Fase Siang ☀️' : phase === 'Voting' ? 'Fase Voting 🗳️' : phase === 'Elimination' ? 'Eliminasi ⏳' : 'Fase Malam 🌙'}
              </h2>
              {phase !== 'Elimination' && (
                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Waktu tersisa: 00:{String(timeLeft).padStart(2, '0')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setIsFlipped(true); setShowRolePopup(true); }}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                🃏 Role
              </button>

              {phase === 'Malam' && NIGHT_ACTION_ROLES.includes(roleName) && !nightSubmitted && me?.alive && (
                <button onClick={() => setShowNightDrawer(true)}
                  style={{ background: 'var(--danger-color)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  🌙 Aksi
                </button>
              )}
              {phase === 'Voting' ? (
                <button onClick={() => setShowVoteDrawer(true)}
                  style={{ background: 'var(--danger-color)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗳️ Vote
                </button>
              ) : (
                <button onClick={() => setShowPlayerList(true)}
                  style={{ background: 'var(--primary-color)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  👥 Pemain
                </button>
              )}
            </div>
          </div>

          {/* Chat */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: phase === 'Malam' ? '#020617' : '#0F172A',
              backgroundImage: phase === 'Malam'
                ? 'radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)'
                : 'radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.15) 0%, transparent 60%)',
              transition: 'all 1.5s ease', zIndex: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: '12rem', opacity: phase === 'Malam' ? 0.05 : 0.08 }}>
                {phase === 'Malam' ? '🌙' : '☀️'}
              </span>
            </div>

            <div className="chat-container" style={{ background: 'transparent', zIndex: 1, position: 'relative' }}>
              {chatMessages.map(msg => (
                msg.isSystem ? (
                  <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div key={msg.id} className={`chat-bubble-wrapper ${msg.senderId === playerId ? 'mine' : 'other'}`}>
                    <div className={`chat-bubble ${msg.senderId === playerId ? 'mine' : 'other'}`} style={{
                      background: msg.isNightChat ? 'rgba(127,29,29,0.55)' : (msg.senderId === playerId ? 'var(--primary-color)' : 'rgba(30,41,59,0.8)'),
                      border: msg.isNightChat ? '1px solid rgba(248,113,113,0.4)' : 'none',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {msg.senderId !== playerId && (
                        <span className="chat-sender">{msg.isNightChat ? `🌙 ${msg.sender}` : msg.sender}</span>
                      )}
                      {msg.text}
                      <span className="chat-time">{msg.time}</span>
                    </div>
                  </div>
                )
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} style={{
            padding: '12px 16px', background: '#1E293B', borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            <input
              type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
              placeholder={
                !me?.alive ? 'Kamu sudah tereliminasi'
                  : phase === 'Malam' ? (isEvilTeam ? '🌙 Chat rahasia sesama tim jahat...' : 'Tidak bisa mengirim pesan...')
                  : 'Ketik pesan...'
              }
              disabled={chatLocked || !me?.alive}
              style={{ margin: 0, flex: 1, borderRadius: '24px', padding: '12px 16px', fontSize: '0.95rem', background: chatLocked ? '#334155' : (phase === 'Malam' ? '#450A0A' : '#0F172A'), color: 'white', border: phase === 'Malam' && isEvilTeam ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(255,255,255,0.1)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '48px', height: '48px', padding: 0, marginBottom: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} disabled={!inputText.trim() || chatLocked || !me?.alive}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateX(-2px)' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </>
      )}

      {/* Player List Drawer */}
      {showPlayerList && (
        <div className="drawer-overlay" onClick={() => setShowPlayerList(false)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Daftar Pemain ({players.length})</h3>
              <button className="drawer-close" onClick={() => setShowPlayerList(false)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px',
                  background: !p.alive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', opacity: !p.alive ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: !p.alive ? '#EF4444' : 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {p.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: '500', textDecoration: !p.alive ? 'line-through' : 'none' }}>{p.name} {p.id === playerId ? '(Kamu)' : ''}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', background: !p.alive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: !p.alive ? '#FCA5A5' : '#6EE7B7', fontWeight: 'bold' }}>
                    {p.alive ? 'Alive' : 'Dead'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vote Drawer */}
      {showVoteDrawer && phase === 'Voting' && (
        <div className="drawer-overlay" style={{ zIndex: 900 }} onClick={() => setShowVoteDrawer(false)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--danger-color)' }}>Voting Eliminasi 🗳️</h3>
              <button className="drawer-close" onClick={() => setShowVoteDrawer(false)}>↓</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Pilih satu pemain. Waktu tersisa: <strong style={{ color: 'var(--danger-color)' }}>00:{String(timeLeft).padStart(2, '0')}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.filter(p => p.alive).map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px',
                  background: votedPlayer === p.id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px', border: votedPlayer === p.id ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <span style={{ fontWeight: '500' }}>{p.name} {p.id === playerId ? '(Kamu)' : ''}</span>
                  {p.id === playerId ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Tidak bisa vote diri sendiri)</span>
                  ) : votedPlayer !== p.id ? (
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 16px', marginBottom: 0, fontSize: '0.85rem' }} onClick={() => handleVote(p.id)}>Pilih</button>
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>✓ Voted</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Night Action Drawer */}
      {showNightDrawer && phase === 'Malam' && me?.alive && !nightSubmitted && (
        <div className="drawer-overlay" style={{ zIndex: 950 }} onClick={() => setShowNightDrawer(false)}>
          <div className="drawer-content" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{nightActionTitle}</h3>
              <button className="drawer-close" onClick={() => setShowNightDrawer(false)}>↓</button>
            </div>

            {seerResult && roleName === 'Seer' && (
              <p style={{ fontSize: '0.85rem', color: '#93C5FD', marginBottom: '12px' }}>
                Hasil intip terakhir: {seerResult.targetName} adalah <strong>{seerResult.team === 'werewolf' ? 'Werewolf' : 'Villager'}</strong>
              </p>
            )}

            {roleName === 'Witch' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Masing-masing ramuan cuma bisa dipakai 1x seumur permainan.</p>
                {alivePlayersExceptMe.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <span>{p.name}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-success" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem', marginBottom: 0 }} onClick={() => handleWitchHeal(p.id)}>💊 Heal</button>
                      <button className="btn btn-primary" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem', marginBottom: 0, background: 'var(--danger-color)' }} onClick={() => handleWitchPoison(p.id)}>☠️ Poison</button>
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary" onClick={() => setShowNightDrawer(false)}>Tidak pakai ramuan malam ini</button>
              </div>
            ) : ['Cupid', 'Troublemaker'].includes(roleName) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(roleName === 'Cupid' ? players.filter(p => p.alive) : alivePlayersExceptMe).map(p => (
                  <button key={p.id} className="btn btn-primary"
                    style={{ opacity: nightPickA === p.id ? 0.5 : 1 }}
                    disabled={nightPickA === p.id}
                    onClick={() => handleTwoTargetPick(p.id)}>
                    {p.name} {nightPickA === p.id ? '(terpilih)' : ''}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alivePlayersExceptMe.map(p => (
                  <button key={p.id} className="btn btn-primary" onClick={() => handleSingleTargetNightAction(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {nightSubmitted && phase === 'Malam' && (
        <div style={{ position: 'fixed', bottom: '90px', left: 0, right: 0, textAlign: 'center', zIndex: 100 }}>
          <span style={{ background: 'rgba(16,185,129,0.2)', color: '#6EE7B7', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem' }}>
            ✓ Aksi malam terkirim
          </span>
        </div>
      )}
    </div>
  );
}
