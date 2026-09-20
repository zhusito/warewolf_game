import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function Login() {
  const navigate = useNavigate();
  const { playerName, setPlayerName } = useGame();
  const [name, setName] = useState(playerName || '');

  const handleLogin = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setPlayerName(name.trim());
      navigate('/home');
    }
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ width: '100%' }}>
      <div style={{ marginBottom: '32px' }}>
        {/* Placeholder Icon / Logo */}
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🐺</div>
        <h1>Game Werewolf MBTI</h1>
        <p>Masukan nama kamu untuk memulai permainan</p>
      </div>

      <form onSubmit={handleLogin}>
        <input 
          type="text" 
          placeholder="Siapa nama kamu?" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!name.trim()}
        >
          Masuk ke Game
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </button>
      </form>

      <div style={{ marginTop: '32px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5', opacity: 0.8 }}>
        Game ini dibuat untuk para member grup <strong>MBTI Collective Community</strong>.<br/>
        Made by <strong>Desta and rell</strong>
      </div>
    </div>
  );
}
