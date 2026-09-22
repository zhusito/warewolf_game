import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Home() {
  const navigate = useNavigate();
  const { playerName, createRoom, joinError } = useGame();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerName) navigate('/');
  }, [playerName, navigate]);

  const handleCreateRoom = async () => {
    setLoading(true);
    const res = await createRoom(playerName);
    setLoading(false);
    if (res.ok) navigate('/room');
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ width: '100%' }}>
      <h1 style={{ marginBottom: '32px' }}>Pilih Mode Permainan</h1>

      {joinError && (
        <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '16px' }}>{joinError}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button 
          onClick={() => navigate('/private-room')} 
          className="btn btn-secondary animate-slide-up stagger-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Private Room (Punya Kode)
        </button>
        
        <button 
          onClick={handleCreateRoom}
          disabled={loading}
          className="btn btn-primary animate-slide-up stagger-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          {loading ? 'Membuat Room...' : 'Buat Room Baru (Jadi Host)'}
        </button>
      </div>

      <button
        onClick={() => navigate('/')}
        className="btn btn-secondary"
        style={{ marginTop: '24px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"></path>
        </svg>
        Ganti Username
      </button>
    </div>
  );
}
