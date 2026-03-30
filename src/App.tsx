import { GameProvider } from './hooks/useGameState';
import Layout from './components/Layout';
import './styles/game.css';

export default function App() {
  return (
    <GameProvider>
      <Layout />
    </GameProvider>
  );
}
