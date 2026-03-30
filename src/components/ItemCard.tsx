import type { Item } from '../types';
import { RARITY_COLORS } from '../types';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  grid?: boolean;
}

const SLOT_ABBREV: Record<string, string> = {
  weapon: 'WPN', offhand: 'OFF', helmet: 'HLM', chest: 'CHT',
  legs: 'LGS', boots: 'BTS', ring: 'RNG', amulet: 'AMU',
};

export default function ItemCard({ item, onClick, selected, compact, grid }: ItemCardProps) {
  const color = RARITY_COLORS[item.rarity];

  if (grid) {
    return (
      <div
        className={`item-card grid ${selected ? 'selected' : ''}`}
        style={{ borderColor: color }}
        onClick={onClick}
      >
        <span className="grid-slot" style={{ color }}>{SLOT_ABBREV[item.slot] ?? item.slot}</span>
        <span className="grid-name" style={{ color }}>{item.name}</span>
        <span className="grid-level">Lv.{item.itemLevel}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`item-card compact ${selected ? 'selected' : ''}`}
        style={{ borderColor: color }}
        onClick={onClick}
      >
        <span className="item-name" style={{ color }}>{item.name}</span>
        <span className="item-level">Lv.{item.itemLevel}</span>
      </div>
    );
  }

  return (
    <div
      className={`item-card ${selected ? 'selected' : ''}`}
      style={{ borderColor: color }}
      onClick={onClick}
    >
      <div className="item-header">
        <span className="item-name" style={{ color }}>{item.name}</span>
        <span className="item-rarity" style={{ color }}>({item.rarity})</span>
      </div>
      <div className="item-details">
        <span>Slot: {item.slot}</span>
        <span>Level: {item.itemLevel}</span>
        <span>Primary: +{item.primaryStatValue} {item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet' ? 'ATK' : 'DEF'}</span>
      </div>
      {item.bonusStats.length > 0 && (
        <div className="item-bonuses">
          {item.bonusStats.map((b, i) => (
            <span key={i} className="bonus-stat">
              +{b.type === 'critChance' || b.type === 'dodgeChance'
                ? `${(b.value * 100).toFixed(1)}% ${b.type === 'critChance' ? 'Crit' : 'Dodge'}`
                : `${b.value} ${b.type.toUpperCase()}`}
            </span>
          ))}
        </div>
      )}
      <div className="item-footer">
        <span className="sell-value">{item.sellValue}g</span>
      </div>
    </div>
  );
}
