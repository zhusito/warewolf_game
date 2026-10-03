import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="glass-panel animate-slide-up" style={{ width: '100%' }}>
      <h1>Game Hub</h1>
      <button className="btn btn-primary" onClick={() => navigate('/werewolf')}>
        Werewolf MBTI
      </button>
    </div>
  );
}
