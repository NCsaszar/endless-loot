import { useRef, useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import StatBar from './StatBar';
import AttackBar from './AttackBar';
import { getZone } from '../data/zones';
import type { DamagePopup } from '../types';
import { LOG_FILTER_TABS } from '../types';
import type { LogFilterTab } from '../types';
import { calculateActualDps, calculateTheoreticalPlayerDps, calculateTheoreticalMobDps } from '../systems/dps';

const LOG_FILTER_KEY = 'endless_loot_log_filter';

function getHitClass(popups: DamagePopup[], target: 'player' | 'mob'): string {
  const now = Date.now();
  const recent = popups.filter(p => p.target === target && now - p.timestamp < 200);
  if (recent.length === 0) return '';
  const last = recent[recent.length - 1];
  if (last.type === 'dodge') return 'anim-dodge';
  if (last.isCrit) return 'anim-crit-hit';
  return 'anim-hit';
}

export default function CombatView() {
  const { state, derived } = useGameState();
  const { combat, character, currentZoneId, combatLog } = state;
  const mob = combat.currentMob;
  const zone = getZone(currentZoneId);

  const playerHitClass = getHitClass(combat.damagePopups, 'player');
  const mobHitClass = getHitClass(combat.damagePopups, 'mob');

  // Portrait flash on attack fire
  const prevPlayerProg = useRef(combat.playerAttackProgress);
  const prevMobProg = useRef(combat.mobAttackProgress);
  const [playerFireKey, setPlayerFireKey] = useState(0);
  const [mobFireKey, setMobFireKey] = useState(0);

  const [logFilter, setLogFilter] = useState<LogFilterTab>(() => {
    const saved = localStorage.getItem(LOG_FILTER_KEY);
    return (saved && saved in LOG_FILTER_TABS) ? saved as LogFilterTab : 'All';
  });

  const handleFilterChange = (tab: LogFilterTab) => {
    setLogFilter(tab);
    localStorage.setItem(LOG_FILTER_KEY, tab);
  };

  useEffect(() => {
    if (prevPlayerProg.current > 0.7 && combat.playerAttackProgress < 0.2) {
      setMobFireKey(k => k + 1); // player attacks mob -> flash mob portrait
    }
    prevPlayerProg.current = combat.playerAttackProgress;
  }, [combat.playerAttackProgress]);

  useEffect(() => {
    if (prevMobProg.current > 0.7 && combat.mobAttackProgress < 0.2) {
      setPlayerFireKey(k => k + 1); // mob attacks player -> flash player portrait
    }
    prevMobProg.current = combat.mobAttackProgress;
  }, [combat.mobAttackProgress]);

  return (
    <div className="combat-view">
      <div className="zone-header">
        <span className="zone-name">
          {state.endless.active
            ? `The Abyss — Floor ${state.endless.currentFloor}`
            : (zone?.name ?? 'Unknown')}
        </span>
        <span className="kill-count">
          {state.endless.active
            ? `Kills: ${state.endless.runKills}`
            : `Kills: ${combat.killCount}`}
        </span>
      </div>

      <div className="combat-arena">
        {/* Player side */}
        <div className={`combatant player-side ${combat.isPlayerDead ? 'anim-dead' : ''}`}>
          <div className={`combatant-portrait player-portrait ${playerHitClass}`}>
            <img src="/portraits/hero.svg" alt="Hero" className="portrait-img" />
            {playerFireKey > 0 && <div key={playerFireKey} className="portrait-flash-overlay" />}
            {combat.damagePopups
              .filter(p => p.target === 'player')
              .map(p => (
                <span key={p.id} className={`damage-popup ${p.type} ${p.isCrit ? 'crit' : ''}`}>
                  {p.type === 'dodge' ? 'DODGE' : p.amount}
                </span>
              ))}
          </div>
          <div className="combatant-name">{character.name} Lv.{character.level}</div>
          <StatBar
            current={character.currentHp}
            max={derived.maxHp}
            color="#4a4"
            label="HP"
          />
          <div className="attack-bar-container">
            <AttackBar
              progress={combat.playerAttackProgress}
              color="#4af"
              height={10}
            />
          </div>
          <div className="dps-display">
            <span>DPS: {calculateActualDps(combat.playerDamageLog).toFixed(1)}</span>
            <span className="dps-sheet">Sheet: {calculateTheoreticalPlayerDps(derived, mob?.defense ?? 0).toFixed(1)}</span>
          </div>
        </div>

        <div className="vs-divider">VS</div>

        {/* Mob side */}
        <div className="combatant mob-side">
          {mob ? (
            <>
              <div className={`combatant-portrait mob-portrait ${mob.def.isBoss ? 'boss' : ''} ${mobHitClass}`}>
                {mob.def.portrait ? (
                  <img src={mob.def.portrait} alt={mob.def.name} className="portrait-img" />
                ) : (
                  <span className="portrait-emoji">{mob.def.isBoss ? '💀' : '👾'}</span>
                )}
                {mobFireKey > 0 && <div key={mobFireKey} className="portrait-flash-overlay" />}
                {combat.damagePopups
                  .filter(p => p.target === 'mob')
                  .map(p => (
                    <span key={p.id} className={`damage-popup ${p.type} ${p.isCrit ? 'crit' : ''}`}>
                      {p.amount}
                    </span>
                  ))}
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
                <AttackBar
                  progress={combat.mobAttackProgress}
                  color="#f84"
                  height={10}
                />
              </div>
              <div className="dps-display">
                <span>DPS: {calculateActualDps(combat.mobDamageLog).toFixed(1)}</span>
                <span className="dps-sheet">Sheet: {calculateTheoreticalMobDps(mob, derived).toFixed(1)}</span>
              </div>
            </>
          ) : (
            <div className="waiting-mob">Spawning...</div>
          )}
        </div>
      </div>

      {/* Combat Log */}
      <div className="combat-log-container">
        <div className="log-filter-tabs">
          {(Object.keys(LOG_FILTER_TABS) as LogFilterTab[]).map(tab => (
            <button
              key={tab}
              className={`log-filter-tab ${logFilter === tab ? 'active' : ''}`}
              onClick={() => handleFilterChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="combat-log">
          {combatLog
            .filter(entry => {
              const allowed = LOG_FILTER_TABS[logFilter];
              return allowed === null || allowed.includes(entry.type);
            })
            .slice(0, 15)
            .map(entry => (
              <div key={entry.id} className={`log-entry log-${entry.type}`}>
                {entry.message}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
