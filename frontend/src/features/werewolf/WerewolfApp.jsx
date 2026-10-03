import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import GameArea from './pages/GameArea';
import Home from './pages/Home';
import HowToPlay from './pages/HowToPlay';
import Login from './pages/Login';
import PrivateRoom from './pages/PrivateRoom';
import Result from './pages/Result';
import WaitingRoom from './pages/WaitingRoom';
import {
  initAudio,
  playBGM,
  playClickSound,
  resumeBGM,
} from './services/soundManager';

function BGMController() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === '/werewolf/game') {
      // GameArea handles its own BGM based on Siang/Malam phase.
    } else if (path === '/werewolf/result') {
      const winner = location.state?.winner;
      playBGM(winner === 'werewolves' ? 'victory_werewolf' : 'victory_villager');
    } else if (path === '/werewolf') {
      playBGM('none');
    } else {
      playBGM('menu');
    }
  }, [location]);

  return null;
}

function WerewolfRoutes() {
  return (
    <Routes>
      <Route index element={<Login />} />
      <Route path="home" element={<Home />} />
      <Route path="private-room" element={<PrivateRoom />} />
      <Route path="room" element={<WaitingRoom />} />
      <Route path="game" element={<GameArea />} />
      <Route path="result" element={<Result />} />
      <Route path="how-to-play" element={<HowToPlay />} />
    </Routes>
  );
}

export default function WerewolfApp() {
  useEffect(() => {
    let hasInteracted = false;
    const handleClick = (event) => {
      initAudio();

      if (!hasInteracted) {
        hasInteracted = true;
        resumeBGM();
      }

      if (event.target.closest('button') || event.target.closest('.btn') || event.target.closest('.card-scene')) {
        playClickSound();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <GameProvider>
      <BGMController />
      <WerewolfRoutes />
    </GameProvider>
  );
}
