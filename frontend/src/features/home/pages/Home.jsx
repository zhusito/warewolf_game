import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="glass-panel animate-slide-up home-hub" style={{ width: '100%' }}>
      <h1 className="home-hub-title">Game Hub</h1>
      <button className="btn btn-primary home-hub-action" onClick={() => navigate('/werewolf')}>
        Werewolf MBTI
      </button>
    </div>
  );
}
