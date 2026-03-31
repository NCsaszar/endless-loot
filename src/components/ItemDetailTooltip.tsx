import { createPortal } from 'react-dom';
import type { Item, Affix } from '../types';
import { RARITY_COLORS } from '../types';
import { formatAffix } from '../data/affixes';

interface ItemDetailTooltipProps {
  item: Item;
  position: { x: number; y: number };
}

export default function ItemDetailTooltip({ item, position }: ItemDetailTooltipProps) {
  const color = RARITY_COLORS[item.rarity];
  const filledPrefixes = item.prefixes.filter((a): a is Affix => a !== null);
  const filledSuffixes = item.suffixes.filter((a): a is Affix => a !== null);
  const isAttackSlot = item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet';

  return createPortal(
    <div
      className="item-tooltip equip-hover-tooltip"
      style={{
        borderColor: color,
        left: position.x,
        top: position.y,
      }}
    >
      <div className="tooltip-name" style={{ color }}>{item.name}</div>
      <div className="tooltip-meta">
        {item.slot} &middot; Lv.{item.itemLevel} &middot; <span style={{ color }}>({item.rarity})</span>
      </div>
      <div className="tooltip-stat">
        Primary: +{item.primaryStatValue} {isAttackSlot ? 'ATK' : 'DEF'}
      </div>
      <div className="tooltip-stat">
        +{item.randomPrimaryStatValue} {item.randomPrimaryStat.toUpperCase()}
      </div>
      {(filledPrefixes.length > 0 || filledSuffixes.length > 0) && (
        <div className="tooltip-bonuses">
          {filledPrefixes.map((a, i) => (
            <div key={`p${i}`} style={{ color: '#ffcc44' }}>{formatAffix(a)}</div>
          ))}
          {filledSuffixes.map((a, i) => (
            <div key={`s${i}`} style={{ color: '#44ccff' }}>{formatAffix(a)}</div>
          ))}
        </div>
      )}
      <div className="tooltip-value">{item.sellValue}g</div>
    </div>,
    document.body
  );
}
