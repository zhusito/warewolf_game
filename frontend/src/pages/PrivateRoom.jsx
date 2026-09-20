import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function PrivateRoom() {
  const navigate = useNavigate();
  const { playerName, joinRoom, joinError } = useGame();
  const [roomKey, setRoomKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomKey.trim()) return;
    setLoading(true);
    const res = await joinRoom(roomKey.trim().toUpperCase(), playerName);
    setLoading(false);
    if (res.ok) navigate('/room');
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ width: '100%' }}>
      <button 
        onClick={() => navigate('/home')}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-muted)', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: 0,
          fontFamily: 'inherit',
          fontSize: '0.9rem'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Kembali
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Private Room</h1>
        <p>Masukan kode room untuk bergabung</p>
      </div>

      {joinError && (
        <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '16px' }}>{joinError}</p>
      )}

      <form onSubmit={handleJoin}>
        <input 
          type="text" 
          placeholder="Contoh: AB12CD" 
          value={roomKey}
          onChange={(e) => setRoomKey(e.target.value)}
          autoFocus
          required
          style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}
        />
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!roomKey.trim() || loading}
        >
          {loading ? 'Menghubungkan...' : 'Masuk Ruangan'}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>
      </form>
    </div>
  );
}
