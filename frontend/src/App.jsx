import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import PrivateRoom from './pages/PrivateRoom';
import WaitingRoom from './pages/WaitingRoom';
import GameArea from './pages/GameArea';
import Result from './pages/Result';
import HowToPlay from './pages/HowToPlay';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { playClickSound, initAudio, playBGM, resumeBGM } from './utils/soundManager';
import { GameProvider } from './context/GameContext';

function BGMController() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    if (path === '/game') {
      // GameArea handles its own BGM based on Siang/Malam phase
    } else if (path === '/result') {
      const winner = location.state?.winner;
      if (winner === 'werewolves') {
        playBGM('victory_werewolf');
      } else {
        playBGM('victory_villager');
      }
    } else if (path === '/') {
      // Prevent autoplay block by not playing anything on the login screen.
      // It will start playing when they enter /home
      playBGM('none');
    } else {
      playBGM('menu');
    }
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    let hasInteracted = false;
    const handleClick = (e) => {
      initAudio();
      
      if (!hasInteracted) {
        hasInteracted = true;
        resumeBGM();
      }

      if (e.target.closest('button') || e.target.closest('.btn') || e.target.closest('.card-scene')) {
        playClickSound();
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <GameProvider>
      <BrowserRouter>
        <BGMController />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/private-room" element={<PrivateRoom />} />
          <Route path="/room" element={<WaitingRoom />} />
          <Route path="/game" element={<GameArea />} />
          <Route path="/result" element={<Result />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;