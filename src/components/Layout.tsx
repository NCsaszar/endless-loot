import { useGameState } from '../hooks/useGameState';
import type { ActivePanel } from '../types';
import CombatView from './CombatView';
import CharacterPanel from './CharacterPanel';
import InventoryPanel from './InventoryPanel';
import TrainingPanel from './TrainingPanel';
import ZonePanel from './ZonePanel';
import WelcomeBack from './WelcomeBack';

const TABS: { id: ActivePanel; label: string }[] = [
  { id: 'character', label: 'Character' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'training', label: 'Training' },
  { id: 'zones', label: 'Zones' },
];

export default function Layout() {
  const { activePanel, setActivePanel, state } = useGameState();

  const renderPanel = () => {
    switch (activePanel) {
      case 'character': return <CharacterPanel />;
      case 'inventory': return <InventoryPanel />;
      case 'training': return <TrainingPanel />;
      case 'zones': return <ZonePanel />;
    }
  };

  return (
    <div className="game-layout">
      <nav className="game-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activePanel === tab.id ? 'active' : ''}`}
            onClick={() => setActivePanel(tab.id)}
          >
            {tab.label}
            {tab.id === 'inventory' && state.inventory.length > 0 && (
              <span className="tab-badge">{state.inventory.length}</span>
            )}
            {tab.id === 'character' && state.character.unspentStatPoints > 0 && (
              <span className="tab-badge">{state.character.unspentStatPoints}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="game-content">
        <div className="left-panel">
          {renderPanel()}
        </div>
        <div className="right-panel">
          <CombatView />
        </div>
      </div>

      <WelcomeBack />
    </div>
  );
}
