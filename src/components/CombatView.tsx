import { useGameState } from '../hooks/useGameState';
import StatBar from './StatBar';
import { getZone } from '../data/zones';

export default function CombatView() {
  const { state, derived } = useGameState();
  const { combat, character, currentZoneId, combatLog } = state;
  const mob = combat.currentMob;
  const zone = getZone(currentZoneId);

  return (
    <div className="combat-view">
      <div className="zone-header">
        <span className="zone-name">{zone?.name ?? 'Unknown'}</span>
        <span className="kill-count">Kills: {combat.killCount}</span>
      </div>

      <div className="combat-arena">
        {/* Player side */}
        <div className="combatant player-side">
          <div className="combatant-portrait player-portrait">
            <span className="portrait-emoji">&#x2694;</span>
          </div>
          <div className="combatant-name">{character.name} Lv.{character.level}</div>
          <StatBar
            current={character.currentHp}
            max={derived.maxHp}
            color="#4a4"
            label="HP"
          />
          <div className="attack-bar-container">
            <StatBar
              current={combat.playerAttackProgress}
              max={1}
              color="#4af"
              height={10}
              showText={false}
            />
          </div>
        </div>

        <div className="vs-divider">VS</div>

        {/* Mob side */}
        <div className="combatant mob-side">
          {mob ? (
            <>
              <div className={`combatant-portrait mob-portrait ${mob.def.isBoss ? 'boss' : ''}`}>
                <span className="portrait-emoji">{mob.def.isBoss ? '&#x1F480;' : '&#x1F47E;'}</span>
              </div>
              <div className="combatant-name">
                {mob.def.isBoss && <span className="boss-tag">BOSS </span>}
                {mob.def.name} Lv.{mob.level}
              </div>
              <StatBar
                current={mob.currentHp}
                max={mob.maxHp}
                color="#e44"
                label="HP"
              />
              <div className="attack-bar-container">
                <StatBar
                  current={combat.mobAttackProgress}
                  max={1}
                  color="#f84"
                  height={10}
                  showText={false}
                />
              </div>
            </>
          ) : (
            <div className="waiting-mob">Spawning...</div>
          )}
        </div>
      </div>

      {/* Combat Log */}
      <div className="combat-log">
        {combatLog.slice(0, 15).map(entry => (
          <div key={entry.id} className={`log-entry log-${entry.type}`}>
            {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
