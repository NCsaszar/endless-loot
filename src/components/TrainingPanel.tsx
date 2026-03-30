import { useGameState } from '../hooks/useGameState';
import { trainingCost } from '../data/formulas';

export default function TrainingPanel() {
  const { state, doTrainStat } = useGameState();

  const stats = ['str', 'dex', 'int', 'vit', 'luk'] as const;
  const descriptions: Record<string, string> = {
    str: 'Increases Attack Power',
    dex: 'Increases Speed, Crit, Dodge',
    int: 'Increases Magic Power (future)',
    vit: 'Increases HP, Defense, Regen',
    luk: 'Increases Drop Rates, Rarity, Gold',
  };

  return (
    <div className="training-panel">
      <h2>Stat Training</h2>
      <p className="training-desc">Spend gold to permanently boost your base stats.</p>
      <div className="training-gold">Gold: {state.gold.toLocaleString()}</div>

      <div className="training-grid">
        {stats.map(stat => {
          const level = state.trainingLevels[stat];
          const cost = trainingCost(level);
          const canAfford = state.gold >= cost;

          return (
            <div key={stat} className="training-row">
              <div className="training-stat-info">
                <span className="training-stat-name">{stat.toUpperCase()}</span>
                <span className="training-stat-level">Training Lv.{level}</span>
                <span className="training-stat-desc">{descriptions[stat]}</span>
              </div>
              <button
                className="training-btn"
                disabled={!canAfford}
                onClick={() => doTrainStat(stat)}
              >
                Train (+1) — {cost.toLocaleString()}g
              </button>
            </div>
          );
        })}
      </div>

      <div className="materials-section">
        <h3>Materials</h3>
        <div className="materials-grid">
          <div><span>Scrap</span><span>{state.materials.scrap}</span></div>
          <div><span>Fragments</span><span>{state.materials.fragments}</span></div>
          <div><span>Crystals</span><span>{state.materials.crystals}</span></div>
          <div><span>Essences</span><span>{state.materials.essences}</span></div>
          <div><span>Legendary Shards</span><span>{state.materials.legendaryShards}</span></div>
        </div>
      </div>
    </div>
  );
}
