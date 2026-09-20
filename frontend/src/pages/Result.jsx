import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getRoleImage } from '../roleImages';

export default function Result() {
  const navigate = useNavigate();
  const { gameResult, leaveSession } = useGame();

  const winner = gameResult?.winner;
  const players = gameResult?.players;

  if (!winner || !players) {
    return (
      <div className="glass-panel" style={{ width: '100%', textAlign: 'center' }}>
         <p>Data hasil pertandingan tidak ditemukan.</p>
         <button className="btn btn-primary" onClick={() => navigate('/home')}>Kembali ke Beranda</button>
      </div>
    );
  }

  const teamLabel = { werewolf: 'Werewolf', villager: 'Villager', vampire: 'Vampire' };
  const teamEmoji = { werewolf: '🐺', villager: '🧑‍🌾', vampire: '🦇' };
  const teams = [...new Set(players.map(p => p.team))];

  const winnerLabel = {
    werewolves: 'WEREWOLVES WIN',
    villagers: 'VILLAGERS WIN',
    vampires: 'VAMPIRES WIN',
    lovers: 'THE LOVERS WIN'
  }[winner] || 'GAME OVER';

  const winnerSubtitle = {
    werewolves: 'Malam telah menelan desa ini. Serigala berkuasa.',
    villagers: 'Warga desa berhasil selamat dari teror.',
    vampires: 'Kegelapan menyebar. Vampire menguasai desa.',
    lovers: 'Cinta mengalahkan segalanya. Sepasang kekasih ini bertahan sampai akhir.'
  }[winner] || '';

  const handlePlayAgain = () => {
    leaveSession();
    navigate('/home');
  };

  return (
    <div className={`animate-fade-in win-overlay ${winner === 'werewolves' ? 'werewolves' : 'villagers'}`} style={{ position: 'fixed', overflowY: 'auto', padding: '40px 20px', justifyContent: 'flex-start' }}>

      <h1 className="win-title" style={{ marginTop: '20px' }}>{winnerLabel}</h1>
      <p className="win-subtitle" style={{ marginBottom: '40px' }}>{winnerSubtitle}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', maxWidth: '440px', paddingBottom: '30px' }}>
        {teams.map(team => (
          <div key={team} style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', justifyContent: 'center' }}>
              {teamEmoji[team] || '👤'} Tim {teamLabel[team] || team}
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {players.filter(p => p.team === team).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px' }}>
                  <img src={getRoleImage(p.role)} alt={p.role} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', border: '2px solid white' }} />
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'white' }}>{p.name} {!p.alive ? '☠️' : ''}</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '440px', marginTop: '10px' }}>
        <button onClick={handlePlayAgain} className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px', fontWeight: 'bold' }}>
          Main Lagi
        </button>
      </div>

    </div>
  );
}
