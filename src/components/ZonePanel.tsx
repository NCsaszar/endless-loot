import { useGameState } from '../hooks/useGameState';
import { ZONES } from '../data/zones';

export default function ZonePanel() {
  const { state, doChangeZone } = useGameState();

  return (
    <div className="zone-panel">
      <h2>Zones</h2>
      <div className="zone-list">
        {ZONES.map(zone => {
          const unlocked = state.unlockedZoneIds.includes(zone.id);
          const active = state.currentZoneId === zone.id;
          const bossDefeated = state.bossesDefeated.includes(zone.id);

          return (
            <div
              key={zone.id}
              className={`zone-card ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
              onClick={() => unlocked && doChangeZone(zone.id)}
            >
              <div className="zone-card-header">
                <span className="zone-card-name">{zone.name}</span>
                {active && <span className="zone-active-badge">CURRENT</span>}
                {!unlocked && <span className="zone-locked-badge">LOCKED</span>}
              </div>
              <div className="zone-card-info">
                <span>Levels {zone.levelRange[0]}–{zone.levelRange[1]}</span>
                <span>Mobs: {zone.mobs.map(m => m.name).join(', ')}</span>
                <span>Boss: {zone.boss.name} {bossDefeated ? '(Defeated)' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="zone-stats">
        <div>Total Kills: {state.totalKills.toLocaleString()}</div>
        <div>Total Gold Earned: {state.totalGoldEarned.toLocaleString()}</div>
      </div>
    </div>
  );
}
