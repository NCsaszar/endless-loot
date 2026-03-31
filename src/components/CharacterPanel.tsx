import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { EquipSlot } from '../types';
import { SLOT_LABELS } from '../types';
import StatBar from './StatBar';
import ItemCard from './ItemCard';
import Tooltip from './Tooltip';
import EquipSlotPopover from './EquipSlotPopover';
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
  const [activePopoverSlot, setActivePopoverSlot] = useState<EquipSlot | null>(null);

  const renderSlot = (slot: EquipSlot, align: 'left' | 'right') => {
    const item = state.equipment[slot];
    return (
      <div
        key={slot}
        className={`paper-doll-slot ${activePopoverSlot === slot ? 'active' : ''}`}
        onClick={() => setActivePopoverSlot(activePopoverSlot === slot ? null : slot)}
      >
        <div className="equip-label">{SLOT_LABELS[slot]}</div>
        {item ? (
          <ItemCard item={item} compact />
        ) : (
          <div className="equip-empty-doll">
            {(() => { const Icon = SLOT_ICONS[slot]; return <Icon size={28} color="currentColor" className="equip-empty-icon" />; })()}
          </div>
        )}
        {activePopoverSlot === slot && (
          <EquipSlotPopover
            slot={slot}
            items={state.inventory.filter(i => i.slot === slot)}
            currentDerived={derived}
            state={state}
            hasEquipped={!!item}
            align={align}
            onSelect={(newItem) => { doEquipItem(newItem); setActivePopoverSlot(null); }}
            onUnequip={() => { doUnequipItem(slot); setActivePopoverSlot(null); }}
            onClose={() => setActivePopoverSlot(null)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="character-panel">
      <div className="char-header">
        <h2>{character.name} — Level {character.level}</h2>
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
            <Tooltip key={stat} text={STAT_TIPS[stat]}>
              <div className="stat-row">
                <span className="stat-name">{stat.toUpperCase()}</span>
                <span className="stat-value">
                  {character.baseStats[stat]}
                </span>
                {character.unspentStatPoints > 0 && (
                  <div className="stat-btn-group">
                    <button className="stat-btn" onClick={() => doAllocateStat(stat)}>+1</button>
                    {character.unspentStatPoints >= 5 && (
                      <button className="stat-btn" onClick={() => doAllocateStatMultiple(stat, 5)}>+5</button>
                    )}
                    {character.unspentStatPoints >= 10 && (
                      <button className="stat-btn" onClick={() => doAllocateStatMultiple(stat, 10)}>+10</button>
                    )}
                    <button className="stat-btn stat-btn-max" onClick={() => doAllocateStatMultiple(stat, character.unspentStatPoints)}>Max</button>
                  </div>
                )}
              </div>
            </Tooltip>
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
            <Tooltip key={key} text={DERIVED_TIPS[key]}>
              <div><span>{key}</span><span>{val}</span></div>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="equipment-section">
        <h3>Equipment</h3>
        <div className="paper-doll">
          <div className="paper-doll-col paper-doll-left">
            {LEFT_SLOTS.map(slot => renderSlot(slot, 'left'))}
          </div>
          <div className="paper-doll-center">
            <img src="/portraits/hero.svg" alt="Hero" className="paper-doll-portrait" />
          </div>
          <div className="paper-doll-col paper-doll-right">
            {RIGHT_SLOTS.map(slot => renderSlot(slot, 'right'))}
          </div>
        </div>
      </div>
    </div>
  );
}
