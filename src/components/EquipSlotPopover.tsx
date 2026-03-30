import { useRef, useEffect } from 'react';
import type { Item, EquipSlot, DerivedStats, GameState } from '../types';
import { RARITY_COLORS } from '../types';
import { computeItemDpsDelta } from '../systems/dps';

interface EquipSlotPopoverProps {
  slot: EquipSlot;
  items: Item[];
  currentDerived: DerivedStats;
  state: GameState;
  hasEquipped: boolean;
  align: 'left' | 'right';
  onSelect: (item: Item) => void;
  onUnequip: () => void;
  onClose: () => void;
}

export default function EquipSlotPopover({
  slot, items, currentDerived, state, hasEquipped, align, onSelect, onUnequip, onClose,
}: EquipSlotPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Sort by DPS delta descending
  const sorted = items
    .map(item => ({ item, delta: computeItemDpsDelta(item, state, currentDerived) }))
    .sort((a, b) => b.delta - a.delta);

  return (
    <div ref={ref} className={`equip-popover ${align}`} onClick={e => e.stopPropagation()}>
      {sorted.length === 0 && (
        <div className="popover-empty">No {slot} items in inventory</div>
      )}
      {sorted.map(({ item, delta }) => {
        const sign = delta > 0 ? '+' : '';
        const cls = delta > 0.02 ? 'positive' : delta < -0.02 ? 'negative' : '';
        return (
          <div
            key={item.id}
            className="equip-popover-item"
            onClick={() => onSelect(item)}
          >
            <span style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</span>
            <span className="popover-level">Lv.{item.itemLevel}</span>
            <span className={`popover-delta ${cls}`}>
              {sign}{(delta * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
      {hasEquipped && (
        <div className="equip-popover-item popover-unequip" onClick={onUnequip}>
          Unequip
        </div>
      )}
    </div>
  );
}
