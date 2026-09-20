import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function WaitingRoom() {
  const navigate = useNavigate();
  const {
    roomCode, players, roomLimits, playerId, isHost,
    toggleReady, startGame, roomStatus
  } = useGame();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomCode) navigate('/home');
  }, [roomCode, navigate]);

  useEffect(() => {
    if (roomStatus === 'in-progress') navigate('/game');
  }, [roomStatus, navigate]);

  const me = players.find(p => p.id === playerId);
  const isGameStartable = players.length >= roomLimits.minPlayers && players.every(p => p.ready);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStart = async () => {
    setStarting(true);
    setStartError('');
    const res = await startGame();
    setStarting(false);
    if (!res.ok) setStartError(res.error || 'Gagal memulai game.');
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ 
            background: 'var(--text-main)', 
            color: 'white',
            width: '64px', 
            height: '64px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Waiting Room</h1>

        <button
          onClick={handleCopyCode}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px dashed var(--primary-color)',
            borderRadius: '12px', padding: '10px 16px', margin: '0 auto 12px', display: 'block',
            fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '3px', color: 'var(--primary-color)', cursor: 'pointer'
          }}
          title="Klik untuk salin kode room"
        >
          {roomCode} {copied ? '✓ Tersalin' : '📋'}
        </button>

        <p style={{ margin: 0, fontWeight: '500' }}>
          {players.length}/{roomLimits.maxPlayers} Players 
          <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            (Minimal {roomLimits.minPlayers} pemain, semua harus ready)
          </span>
        </p>
      </div>

      <div className="player-list">
        {players.map((player, index) => (
          <div 
            key={player.id} 
            className="player-item"
            style={{ animationDelay: `${index * 0.05}s`, opacity: player.connected ? 1 : 0.5, cursor: 'default' }}
          >
            <div className="player-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>
                {player.name} {player.isHost ? '👑' : ''} {player.id === playerId ? '(Kamu)' : ''}
                {!player.connected ? ' (terputus)' : ''}
              </span>
            </div>
            
            <div className={`status-icon ${player.ready ? 'status-ready' : 'status-waiting'}`}>
              {player.ready ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {startError && (
        <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '12px' }}>{startError}</p>
      )}

      {isHost ? (
        <>
          <button
            onClick={toggleReady}
            className="btn btn-success"
            style={{ marginTop: '16px' }}
          >
            {me?.ready ? 'Batal Ready' : 'Saya Siap!'}
          </button>
          <button
            onClick={handleStart}
            className="btn btn-primary"
            disabled={!isGameStartable || starting}
            style={{ marginTop: '8px' }}
          >
            {starting ? 'Memulai...' : isGameStartable ? 'Mulai Game' : 'Menunggu Semua Ready...'}
          </button>
        </>
      ) : (
        <button 
          onClick={toggleReady}
          className="btn btn-success"
          style={{ marginTop: '16px' }}
        >
          {me?.ready ? 'Batal Ready' : 'Saya Siap!'}
        </button>
      )}
    </div>
  );
}
