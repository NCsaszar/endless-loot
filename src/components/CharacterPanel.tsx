import { useGameState } from '../hooks/useGameState';
import { ALL_EQUIP_SLOTS } from '../types';
import type { EquipSlot } from '../types';
import StatBar from './StatBar';
import ItemCard from './ItemCard';

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
            <div key={stat} className="stat-row">
              <span className="stat-name">{stat.toUpperCase()}</span>
              <span className="stat-value">
                {character.baseStats[stat] + state.trainingLevels[stat]}
              </span>
              {character.unspentStatPoints > 0 && (
                <button className="stat-btn" onClick={() => doAllocateStat(stat)}>+</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="derived-section">
        <h3>Derived Stats</h3>
        <div className="derived-grid">
          <div><span>ATK</span><span>{Math.floor(derived.attackPower)}</span></div>
          <div><span>DEF</span><span>{Math.floor(derived.defense)}</span></div>
          <div><span>HP</span><span>{Math.floor(derived.maxHp)}</span></div>
          <div><span>SPD</span><span>{derived.attackSpeed.toFixed(2)}/s</span></div>
          <div><span>CRIT</span><span>{(derived.critChance * 100).toFixed(1)}%</span></div>
          <div><span>DODGE</span><span>{(derived.dodgeChance * 100).toFixed(1)}%</span></div>
          <div><span>REGEN</span><span>{derived.hpRegen.toFixed(1)}/s</span></div>
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
