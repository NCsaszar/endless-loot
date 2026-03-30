import { useGameState } from '../hooks/useGameState';
import { ALL_EQUIP_SLOTS } from '../types';
import type { EquipSlot } from '../types';
import StatBar from './StatBar';
import ItemCard from './ItemCard';
import Tooltip from './Tooltip';

const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: 'Weapon',
  offhand: 'Offhand',
  helmet: 'Helmet',
  chest: 'Chest',
  legs: 'Legs',
  boots: 'Boots',
  ring: 'Ring',
  amulet: 'Amulet',
};

const STAT_TIPS: Record<string, string> = {
  str: 'Strength\n+2.5 Attack Power per point',
  dex: 'Dexterity\n+0.008 Attack Speed per point\n+0.3% Crit Chance per point\n+0.2% Dodge Chance per point',
  int: 'Intelligence\nReserved for future magic system',
  vit: 'Vitality\n+8 Max HP per point\n+1.2 Defense per point\n+0.3/s HP Regen per point',
};

const DERIVED_TIPS: Record<string, string> = {
  ATK: 'Attack Power\nBase damage per hit. Scales with STR.',
  DEF: 'Defense\nReduces incoming damage. Scales with VIT and armor.',
  HP: 'Hit Points\nYour maximum health. Scales with VIT.',
  SPD: 'Attack Speed\nAttacks per second. Scales with DEX.',
  CRIT: 'Critical Chance\nChance to deal bonus damage. Scales with DEX.',
  DODGE: 'Dodge Chance\nChance to avoid an attack. Scales with DEX.',
  REGEN: 'HP Regeneration\nHP restored per second. Scales with VIT.',
};

export default function CharacterPanel() {
  const { state, derived, doAllocateStat, doUnequipItem } = useGameState();
  const { character } = state;

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
          {(['str', 'dex', 'int', 'vit'] as const).map(stat => (
            <Tooltip key={stat} text={STAT_TIPS[stat]}>
              <div className="stat-row">
                <span className="stat-name">{stat.toUpperCase()}</span>
                <span className="stat-value">
                  {character.baseStats[stat] + state.trainingLevels[stat]}
                </span>
                {character.unspentStatPoints > 0 && (
                  <button className="stat-btn" onClick={() => doAllocateStat(stat)}>+</button>
                )}
              </div>
            </Tooltip>
          ))}
        </div>
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
            { key: 'DODGE', val: `${(derived.dodgeChance * 100).toFixed(1)}%` },
            { key: 'REGEN', val: `${derived.hpRegen.toFixed(1)}/s` },
          ].map(({ key, val }) => (
            <Tooltip key={key} text={DERIVED_TIPS[key]}>
              <div><span>{key}</span><span>{val}</span></div>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="equipment-section">
        <h3>Equipment</h3>
        <div className="equip-grid">
          {ALL_EQUIP_SLOTS.map(slot => {
            const item = state.equipment[slot];
            return (
              <div key={slot} className="equip-slot">
                <div className="equip-label">{SLOT_LABELS[slot]}</div>
                {item ? (
                  <div className="equip-item">
                    <ItemCard item={item} compact onClick={() => doUnequipItem(slot)} />
                  </div>
                ) : (
                  <div className="equip-empty">Empty</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
