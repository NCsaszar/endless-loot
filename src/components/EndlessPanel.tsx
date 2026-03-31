import { useGameState } from '../hooks/useGameState';

export default function EndlessPanel() {
  const { state, doStartEndlessRun, doEndEndlessRun } = useGameState();
  const { endless } = state;

  return (
    <div className="endless-panel">
      <h2>The Abyss</h2>
      <p className="endless-subtitle">
        An infinite descent into darkness. How deep can you go?
      </p>

      <div className="endless-stats-card">
        <div className="endless-stat-row">
          <span className="endless-stat-label">Highest Floor</span>
          <span className="endless-stat-value">{endless.highestFloor || '—'}</span>
        </div>
      </div>

      {endless.active ? (
        <>
          <div className="endless-run-card">
            <h3>Current Run</h3>
            <div className="endless-run-stats">
              <div className="endless-stat-row">
                <span className="endless-stat-label">Floor</span>
                <span className="endless-stat-value floor-value">{endless.currentFloor}</span>
              </div>
              <div className="endless-stat-row">
                <span className="endless-stat-label">Kills</span>
                <span className="endless-stat-value">{endless.runKills}</span>
              </div>
              <div className="endless-stat-row">
                <span className="endless-stat-label">Gold Earned</span>
                <span className="endless-stat-value">{endless.runGoldEarned.toLocaleString()}</span>
              </div>
              <div className="endless-stat-row">
                <span className="endless-stat-label">Items Found</span>
                <span className="endless-stat-value">{endless.runItemsFound}</span>
              </div>
              <div className="endless-stat-row">
                <span className="endless-stat-label">Rarity Bonus</span>
                <span className="endless-stat-value">+{(endless.currentFloor * 1).toFixed(0)}%</span>
              </div>
            </div>
            <button
              className="endless-btn retreat"
              onClick={doEndEndlessRun}
            >
              Retreat (Keep Loot)
            </button>
          </div>
        </>
      ) : (
        <div className="endless-start-card">
          <div className="endless-info">
            <h4>Rules</h4>
            <ul>
              <li>Mobs start at level 150+ and get stronger each floor</li>
              <li>Boss encounters every 10 floors</li>
              <li>Loot rarity increases +1% per floor</li>
              <li>Death ends the run — you keep all loot earned</li>
              <li>No limit on runs — descend as often as you dare</li>
            </ul>
          </div>
          <button
            className="endless-btn descend"
            onClick={doStartEndlessRun}
          >
            Descend into The Abyss
          </button>
        </div>
      )}
    </div>
  );
}
