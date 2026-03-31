import { useState, useMemo, useRef, useEffect, memo } from 'react';
import { ZONES, ACT_NAMES, ACT_THEMES } from '../data/zones';
import { EQUIPMENT_RARITIES, RARITY_COLORS } from '../types';
import type { Rarity, ZoneDef, Character, GameState } from '../types';
import { getTotalPrimaryStats, lukRarityShift, lukDropChance } from '../data/formulas';
import { RARITY_CONFIG } from '../systems/loot';

function computeRarityPercents(luk: number, zoneRarityBonus: number = 0): Record<Rarity, number> {
  const shift = lukRarityShift(luk);
  const weights = EQUIPMENT_RARITIES.map(r => {
    const base = RARITY_CONFIG[r].dropWeight;
    return r === 'common' ? base : base * shift * (1 + zoneRarityBonus);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  const result: Record<string, number> = {};
  EQUIPMENT_RARITIES.forEach((r, i) => {
    result[r] = (weights[i] / total) * 100;
  });
  return result as Record<Rarity, number>;
}

// Group zones by act
const ACTS = [1, 2, 3, 4, 5].map(actNum => ({
  act: actNum,
  name: ACT_NAMES[actNum],
  zones: ZONES.filter(z => z.act === actNum),
}));

export interface ZonePanelProps {
  currentZoneId: number;
  unlockedZoneIds: number[];
  bossesDefeated: number[];
  combatActive: boolean;
  character: Character;
  equipment: GameState['equipment'];
  totalKills: number;
  totalGoldEarned: number;
  doChangeZone: (zoneId: number) => void;
  doStartCombat: () => void;
  doStopCombat: () => void;
}

const ZonePanel = memo(function ZonePanel({
  currentZoneId,
  unlockedZoneIds,
  bossesDefeated,
  combatActive,
  character,
  equipment,
  totalKills,
  totalGoldEarned,
  doChangeZone,
  doStartCombat,
  doStopCombat,
}: ZonePanelProps) {
  const [expandedZoneId, setExpandedZoneId] = useState<number | null>(null);
  const [collapsedActs, setCollapsedActs] = useState<Set<number>>(new Set());
  const currentZoneRef = useRef<HTMLDivElement>(null);

  const primaryStats = useMemo(
    () => getTotalPrimaryStats(character, equipment),
    [character, equipment]
  );
  const luk = primaryStats.luk;
  const dropChance = useMemo(() => lukDropChance(luk), [luk]);

  const currentAct = useMemo(() => {
    const zone = ZONES.find(z => z.id === currentZoneId);
    return zone?.act ?? 1;
  }, [currentZoneId]);

  const highestUnlockedZone = useMemo(
    () => Math.max(...unlockedZoneIds),
    [unlockedZoneIds]
  );

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
    const unlocked = unlockedZoneIds.includes(zone.id);
    const active = currentZoneId === zone.id;
    const bossDefeated = bossesDefeated.includes(zone.id);
    const isRunning = active && combatActive;
    const isExpanded = expandedZoneId === zone.id;
    const theme = ACT_THEMES[zone.act];

    return (
      <div
        key={zone.id}
        ref={active ? currentZoneRef : undefined}
        className={`zone-card ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
        style={{
          borderColor: unlocked ? theme.borderColor : undefined,
          boxShadow: active ? `0 0 14px ${theme.glowColor}, inset 0 0 30px rgba(0,0,0,0.3)` : `inset 0 0 30px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Gradient overlay */}
        <div className="zone-card-gradient" style={{ background: theme.gradient }} />

        <div
          className="zone-card-clickable"
          onClick={() => { if (unlocked) toggleExpand(zone.id); }}
        >
          <div className="zone-card-header">
            <div className="zone-card-title">
              <span className="zone-card-number" style={{ color: theme.accentColor }}>#{zone.id}</span>
              <span className="zone-card-name">{zone.name}</span>
            </div>
            <div className="zone-card-badges">
              {active && <span className="zone-active-badge">CURRENT</span>}
              {!unlocked && <span className="zone-locked-badge">LOCKED</span>}
              {bossDefeated && unlocked && <span className="zone-cleared-badge">CLEARED</span>}
            </div>
          </div>

          <div className="zone-card-info">
            <span className="zone-level-range">Lv. {zone.levelRange[0]}–{zone.levelRange[1]}</span>
            <span className="zone-card-divider">&middot;</span>
            <span className={`zone-boss-name ${!bossDefeated && unlocked ? 'boss-pulse' : ''}`}>
              Boss: {zone.boss.name}
            </span>
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
            <div className="zone-details-compact">
              <div className="zone-detail-row">
                <span>Drop chance: <strong>{(dropChance * 100).toFixed(1)}%</strong></span>
                {luk > 0 && <span className="zone-luk-note">LUK boosted</span>}
              </div>
              <div className="zone-rarity-compact">
                {EQUIPMENT_RARITIES.map(r => {
                  const pct = zoneRarityPercents[r];
                  if (pct < 0.05) return null;
                  return (
                    <span key={r} className="zone-rarity-chip" style={{
                      borderColor: RARITY_COLORS[r],
                      color: RARITY_COLORS[r],
                    }}>
                      {r}: {pct.toFixed(1)}%
                    </span>
                  );
                })}
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
          const bossesInAct = zones.filter(z => bossesDefeated.includes(z.id)).length;
          const unlockedInAct = zones.filter(z => unlockedZoneIds.includes(z.id)).length;
          const isCurrentAct = act === currentAct;
          const theme = ACT_THEMES[act];

          return (
            <div key={act} className={`zone-act ${isCurrentAct ? 'current-act' : ''}`}>
              <div
                className="zone-act-header"
                style={{ background: theme.gradient }}
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
        <div>Total Kills: {totalKills.toLocaleString()}</div>
        <div>Total Gold Earned: {totalGoldEarned.toLocaleString()}</div>
      </div>
    </div>
  );
});

export default ZonePanel;
