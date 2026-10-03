import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './features/home/pages/Home';
import WerewolfApp from './features/werewolf/WerewolfApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/werewolf/*" element={<WerewolfApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;