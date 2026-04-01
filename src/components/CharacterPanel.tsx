import { useState, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { EquipSlot } from '../types';
import { SLOT_LABELS } from '../types';
import StatBar from './StatBar';
import ItemCard from './ItemCard';
import Tooltip from './Tooltip';
import ItemDetailTooltip from './ItemDetailTooltip';
import EquipmentComparisonModal from './EquipmentComparisonModal';
import { SLOT_ICONS } from './icons';

const LEFT_SLOTS: EquipSlot[] = ['helmet', 'chest', 'legs', 'boots'];
const RIGHT_SLOTS: EquipSlot[] = ['weapon', 'offhand', 'ring', 'amulet'];

const STAT_TIPS: Record<string, string> = {
  str: 'Strength\n+2.5 Attack Power per point',
  dex: 'Dexterity\n+0.008 Attack Speed per point\n+0.3% Crit Chance per point\n+0.2% Dodge Chance per point',
  int: 'Intelligence\nReserved for future magic system',
  vit: 'Vitality\n+8 Max HP per point\n+1.2 Defense per point\n+0.3/s HP Regen per point',
  luk: 'Luck\nImproves drop rarity, gold find,\nbonus stat rolls, drop rates,\nand boss loot quality',
};

const DERIVED_TIPS: Record<string, string> = {
  ATK: 'Attack Power\nBase damage per hit. Scales with STR.',
  DEF: 'Defense\nReduces incoming damage. Scales with VIT and armor.',
  HP: 'Hit Points\nYour maximum health. Scales with VIT.',
  SPD: 'Attack Speed\nAttacks per second. Scales with DEX.',
  CRIT: 'Critical Chance\nChance to deal bonus damage. Scales with DEX.',
  CDMG: 'Critical Damage\nDamage multiplier on crits. Base 150%.\nScales with gear affixes.',
  DODGE: 'Dodge Chance\nChance to avoid an attack. Scales with DEX.',
  REGEN: 'HP Regeneration\nHP restored per second. Scales with VIT.',
  GOLD: 'Gold Find\nMultiplier on gold from kills.',
  XP: 'XP Gain\nMultiplier on XP from kills.',
  LOOT: 'Loot Rarity\nBonus to rarity drop weights.',
};

export default function CharacterPanel() {
  const { state, derived, doAllocateStat, doAllocateStatMultiple, doResetAllStats, doEquipItem, doUnequipItem } = useGameState();
  const { character } = state;
  const [comparisonSlot, setComparisonSlot] = useState<EquipSlot | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ slot: EquipSlot; pos: { x: number; y: number } } | null>(null);

  const handleSlotHover = useCallback((slot: EquipSlot, el: HTMLElement | null) => {
    if (!el || !state.equipment[slot]) { setHoverTooltip(null); return; }
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 210;
    const halfW = tooltipWidth / 2;
    const x = Math.max(halfW + 4, Math.min(window.innerWidth - halfW - 4, rect.left + rect.width / 2));
    setHoverTooltip({ slot, pos: { x, y: rect.top } });
  }, [state.equipment]);

  const renderSlot = (slot: EquipSlot) => {
    const item = state.equipment[slot];
    return (
      <div
        key={slot}
        className={`paper-doll-slot ${comparisonSlot === slot ? 'active' : ''}`}
        onClick={() => setComparisonSlot(slot)}
        onMouseEnter={(e) => handleSlotHover(slot, e.currentTarget)}
        onMouseLeave={() => setHoverTooltip(null)}
      >
        <div className="equip-label">{SLOT_LABELS[slot]}</div>
        {item ? (
          <ItemCard item={item} compact />
        ) : (
          <div className="equip-empty-doll">
            {(() => { const Icon = SLOT_ICONS[slot]; return <Icon size={28} color="currentColor" className="equip-empty-icon" />; })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="character-panel">
      <div className="panel-ornament panel-ornament-bl" />
      <div className="panel-ornament panel-ornament-br" />
      <div className="char-header">
        <h2>
          <span className="char-name">{character.name}</span>
          <span className="char-level-badge">Lv. {character.level}</span>
        </h2>
        <StatBar
          current={character.xp}
          max={character.xpToNextLevel}
          color="#aa0"
          label="XP"
        />
      </div>

      {character.unspentStatPoints > 0 && (
        <div className="stat-points-banner">
          {character.unspentStatPoints} stat point{character.unspentStatPoints > 1 ? 's' : ''} available!
        </div>
      )}

      <div className="stats-section">
        <h3>Primary Stats</h3>
        <div className="stat-grid">
          {(['str', 'dex', 'int', 'vit', 'luk'] as const).map(stat => (
            <div key={stat} className="stat-row">
              <Tooltip text={STAT_TIPS[stat]}>
                <span className="stat-name">{stat.toUpperCase()}</span>
              </Tooltip>
              <span className="stat-value">
                {character.baseStats[stat]}
              </span>
              <div className="stat-btn-group">
                <button className="stat-btn" disabled={character.unspentStatPoints < 1} onClick={() => doAllocateStat(stat)}>+1</button>
                <button className="stat-btn" disabled={character.unspentStatPoints < 5} onClick={() => doAllocateStatMultiple(stat, 5)}>+5</button>
                <button className="stat-btn" disabled={character.unspentStatPoints < 10} onClick={() => doAllocateStatMultiple(stat, 10)}>+10</button>
                <button className="stat-btn stat-btn-max" disabled={character.unspentStatPoints < 1} onClick={() => doAllocateStatMultiple(stat, character.unspentStatPoints)}>Max</button>
              </div>
            </div>
          ))}
        </div>
        {(() => {
          const tomeCount = state.inventory.filter(i => i.consumable === 'stat_reset').length;
          const hasTome = tomeCount > 0;
          const totalAllocated = (['str', 'dex', 'int', 'vit', 'luk'] as const).reduce(
            (sum, s) => sum + (character.baseStats[s] - 5), 0
          );
          return totalAllocated > 0 ? (
            <button
              className={`btn-reset-stats ${hasTome ? '' : 'disabled'}`}
              disabled={!hasTome}
              onClick={() => {
                if (hasTome && confirm('Reset ALL stat points? This will consume a Tome of Unmaking.')) {
                  doResetAllStats();
                }
              }}
            >
              Reset All Stats {hasTome ? `(${tomeCount}x Tome of Unmaking)` : '(requires Tome of Unmaking)'}
            </button>
          ) : null;
        })()}
      </div>

      <div className="derived-section">
        <h3>Derived Stats</h3>
        <div className="derived-grid">
          {[
            { key: 'ATK', val: Math.floor(derived.attackPower).toString() },
            { key: 'DEF', val: Math.floor(derived.defense).toString() },
            { key: 'HP', val: Math.floor(derived.maxHp).toString() },
            { key: 'SPD', val: `${derived.attackSpeed.toFixed(2)}/s` },
            { key: 'CRIT', val: `${(derived.critChance * 100).toFixed(1)}%` },
            { key: 'CDMG', val: `${(derived.critDamage * 100).toFixed(0)}%` },
            { key: 'DODGE', val: `${(derived.dodgeChance * 100).toFixed(1)}%` },
            { key: 'REGEN', val: `${derived.hpRegen.toFixed(1)}/s` },
            ...(derived.goldFind > 1 ? [{ key: 'GOLD', val: `${(derived.goldFind * 100).toFixed(0)}%` }] : []),
            ...(derived.xpGainBonus > 1 ? [{ key: 'XP', val: `${(derived.xpGainBonus * 100).toFixed(0)}%` }] : []),
            ...(derived.lootRarityBonus > 0 ? [{ key: 'LOOT', val: `+${(derived.lootRarityBonus * 100).toFixed(1)}%` }] : []),
          ].map(({ key, val }) => (
            <div key={key} className="derived-stat-row">
              <Tooltip text={DERIVED_TIPS[key]}>
                <span>{key}</span>
              </Tooltip>
              <span>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="equipment-section">
        <h3>Equipment</h3>
        <div className="paper-doll">
          <div className="paper-doll-col paper-doll-left">
            {LEFT_SLOTS.map(slot => renderSlot(slot))}
          </div>
          <div className="paper-doll-center">
            <img src="/portraits/hero.svg" alt="Hero" className="paper-doll-portrait" />
          </div>
          <div className="paper-doll-col paper-doll-right">
            {RIGHT_SLOTS.map(slot => renderSlot(slot))}
          </div>
        </div>
      </div>

      {/* Hover tooltip for equipped items */}
      {hoverTooltip && state.equipment[hoverTooltip.slot] && !comparisonSlot && (
        <ItemDetailTooltip
          item={state.equipment[hoverTooltip.slot]!}
          position={hoverTooltip.pos}
        />
      )}

      {/* Equipment comparison modal */}
      {comparisonSlot && (
        <EquipmentComparisonModal
          slot={comparisonSlot}
          equippedItem={state.equipment[comparisonSlot] ?? null}
          inventoryItems={state.inventory.filter(i => i.slot === comparisonSlot)}
          state={state}
          derived={derived}
          onEquip={(item) => { doEquipItem(item); setComparisonSlot(null); }}
          onUnequip={() => { doUnequipItem(comparisonSlot); setComparisonSlot(null); }}
          onClose={() => setComparisonSlot(null)}
        />
      )}
    </div>
  );
}
