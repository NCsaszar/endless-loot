import { useState, useMemo, useRef, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';
import { ZONES, ACT_NAMES } from '../data/zones';
import { RARITY_ORDER, RARITY_COLORS, ALL_EQUIP_SLOTS, SLOT_LABELS } from '../types';
import type { Rarity, ZoneDef } from '../types';
import { getTotalPrimaryStats, lukRarityShift, lukDropChance } from '../data/formulas';
import { RARITY_CONFIG, SALVAGE_MAP } from '../systems/loot';
import { BASE_ITEMS } from '../data/items';

function computeRarityPercents(luk: number, zoneRarityBonus: number = 0): Record<Rarity, number> {
  const shift = lukRarityShift(luk);
  const weights = RARITY_ORDER.map(r => {
    const base = RARITY_CONFIG[r].dropWeight;
    return r === 'common' ? base : base * shift * (1 + zoneRarityBonus);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  const result: Record<string, number> = {};
  RARITY_ORDER.forEach((r, i) => {
    result[r] = (weights[i] / total) * 100;
  });
  return result as Record<Rarity, number>;
}

const itemsBySlot = ALL_EQUIP_SLOTS.map(slot => ({
  slot,
  items: BASE_ITEMS.filter(i => i.slot === slot).map(i => i.name),
}));

// Group zones by act
const ACTS = [1, 2, 3, 4, 5].map(actNum => ({
  act: actNum,
  name: ACT_NAMES[actNum],
  zones: ZONES.filter(z => z.act === actNum),
}));

export default function ZonePanel() {
  const { state, doChangeZone, doStartCombat, doStopCombat } = useGameState();
  const [expandedZoneId, setExpandedZoneId] = useState<number | null>(null);
  const [collapsedActs, setCollapsedActs] = useState<Set<number>>(new Set());
  const currentZoneRef = useRef<HTMLDivElement>(null);

  const primaryStats = useMemo(
    () => getTotalPrimaryStats(state.character, state.trainingLevels, state.equipment),
    [state.character, state.trainingLevels, state.equipment]
  );
  const luk = primaryStats.luk;
  const dropChance = useMemo(() => lukDropChance(luk), [luk]);

  // Determine current act from current zone
  const currentAct = useMemo(() => {
    const zone = ZONES.find(z => z.id === state.currentZoneId);
    return zone?.act ?? 1;
  }, [state.currentZoneId]);

  // Highest unlocked zone for progress display
  const highestUnlockedZone = useMemo(
    () => Math.max(...state.unlockedZoneIds),
    [state.unlockedZoneIds]
  );

  // Scroll to current zone on mount
  useEffect(() => {
    if (currentZoneRef.current) {
      currentZoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const toggleExpand = (zoneId: number) => {
    setExpandedZoneId(prev => prev === zoneId ? null : zoneId);
  };

  const toggleAct = (act: number) => {
    setCollapsedActs(prev => {
      const next = new Set(prev);
      if (next.has(act)) next.delete(act);
      else next.add(act);
      return next;
    });
  };

  const renderZoneCard = (zone: ZoneDef) => {
    const unlocked = state.unlockedZoneIds.includes(zone.id);
    const active = state.currentZoneId === zone.id;
    const bossDefeated = state.bossesDefeated.includes(zone.id);
    const isRunning = active && state.combatActive;
    const isExpanded = expandedZoneId === zone.id;

    return (
      <div
        key={zone.id}
        ref={active ? currentZoneRef : undefined}
        className={`zone-card ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
      >
        <div
          className="zone-card-clickable"
          onClick={() => {
            if (unlocked) toggleExpand(zone.id);
          }}
        >
          <div className="zone-card-header">
            <span className="zone-card-name">
              <span className="zone-card-number">#{zone.id}</span> {zone.name}
            </span>
            {active && <span className="zone-active-badge">CURRENT</span>}
            {!unlocked && <span className="zone-locked-badge">LOCKED</span>}
            {unlocked && (
              <span className={`zone-expand-chevron ${isExpanded ? 'expanded' : ''}`}>
                &#9660;
              </span>
            )}
          </div>
          <div className="zone-card-info">
            <span>Levels {zone.levelRange[0]}–{zone.levelRange[1]}</span>
            <span>Mobs: {zone.mobs.map(m => m.name).join(', ')}</span>
            <span>Boss: {zone.boss.name} {bossDefeated ? '(Defeated)' : ''}</span>
          </div>
        </div>

        {unlocked && (
          <button
            className={`zone-combat-btn ${isRunning ? 'stop' : 'start'}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!active) {
                doChangeZone(zone.id);
                setTimeout(() => doStartCombat(), 0);
              } else if (isRunning) {
                doStopCombat();
              } else {
                doStartCombat();
              }
            }}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
        )}

        {isExpanded && unlocked && (() => {
          const zoneRarityPercents = computeRarityPercents(luk, zone.rarityBonus);
          return (
          <div className="zone-details">
            <div className="zone-details-section">
              <h4>Drop Rates</h4>
              <div className="zone-drop-chance">
                Mob drop chance: <strong>{(dropChance * 100).toFixed(1)}%</strong>
                {luk > 0 && <span className="zone-luk-note"> (LUK boosted)</span>}
              </div>
              <div className="zone-rarity-row">
                {RARITY_ORDER.map(r => (
                  <span key={r} className="zone-rarity-item">
                    <span className="zone-rarity-dot" style={{ background: RARITY_COLORS[r] }} />
                    <span style={{ color: RARITY_COLORS[r] }}>
                      {r}: {zoneRarityPercents[r].toFixed(1)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="zone-details-section">
              <h4>Possible Items</h4>
              <div className="zone-items-grid">
                {itemsBySlot.map(({ slot, items }) => (
                  <div key={slot} className="zone-items-slot">
                    <span className="zone-items-slot-label">{SLOT_LABELS[slot]}:</span>
                    <span className="zone-items-list">{items.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="zone-details-section">
              <h4>Salvage Yields</h4>
              <div className="zone-salvage-row">
                {RARITY_ORDER.map(r => (
                  <span key={r} className="zone-salvage-item">
                    <span style={{ color: RARITY_COLORS[r] }}>{r}</span>
                    {' → '}{SALVAGE_MAP[r].amount} {SALVAGE_MAP[r].material}
                  </span>
                ))}
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="zone-panel">
      <h2>Zones</h2>
      <div className="zone-progress">
        Zone Progress: {highestUnlockedZone} / 50
      </div>
      <div className="zone-list">
        {ACTS.map(({ act, name, zones }) => {
          const isCollapsed = collapsedActs.has(act);
          const bossesInAct = zones.filter(z => state.bossesDefeated.includes(z.id)).length;
          const unlockedInAct = zones.filter(z => state.unlockedZoneIds.includes(z.id)).length;
          const isCurrentAct = act === currentAct;

          return (
            <div key={act} className={`zone-act ${isCurrentAct ? 'current-act' : ''}`}>
              <div
                className="zone-act-header"
                onClick={() => toggleAct(act)}
              >
                <span className={`zone-act-chevron ${isCollapsed ? '' : 'expanded'}`}>&#9660;</span>
                <span className="zone-act-title">Act {act}: {name}</span>
                <span className="zone-act-progress">
                  {unlockedInAct > 0 ? `${bossesInAct}/10 cleared` : 'Locked'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="zone-act-zones">
                  {zones.map(renderZoneCard)}
                </div>
              )}
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
