import { useState, useRef, useCallback } from 'react';
import type { Item } from '../types';
import { RARITY_COLORS } from '../types';
import { SLOT_ICONS } from './icons';
import { computeTooltipPosition } from '../utils/tooltipPosition';
import ItemDetailTooltip from './ItemDetailTooltip';

interface InventoryItemCellProps {
  item: Item;
  selected: boolean;
  upgradePct: number;
  isNewLoot: boolean;
  dragHandlers: {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
  isDragging: boolean;
  onClick: (item: Item, e: React.MouseEvent) => void;
  onToggleLock: () => void;
}

export default function InventoryItemCell({
  item, selected, upgradePct, isNewLoot, dragHandlers, isDragging, onClick, onToggleLock,
}: InventoryItemCellProps) {
  const color = RARITY_COLORS[item.rarity];
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  const isUpgrade = upgradePct > 0.02;
  const isBigUpgrade = upgradePct > 0.10;
  const isLegendary = item.rarity === 'legendary';
  const isUnique = item.rarity === 'unique';

  const showTooltip = useCallback(() => {
    if (!cellRef.current) return;
    const rect = cellRef.current.getBoundingClientRect();
    setTooltipPos(computeTooltipPosition(rect));
  }, []);

  const hideTooltip = useCallback(() => setTooltipPos(null), []);

  const Icon = SLOT_ICONS[item.slot];
  const dpsDeltaStr = upgradePct > 0.02 ? `+${(upgradePct * 100).toFixed(0)}%` :
                      upgradePct < -0.02 ? `${(upgradePct * 100).toFixed(0)}%` : null;

  return (
    <>
      <div
        ref={cellRef}
        className={[
          'inv-cell-v2',
          selected && 'selected',
          isDragging && 'dragging',
          isBigUpgrade && 'upgrade-glow',
          isNewLoot && 'new-loot',
          isLegendary && 'legendary-shimmer',
          isUnique && 'unique-shimmer',
          item.locked && 'locked',
        ].filter(Boolean).join(' ')}
        style={{ borderColor: color }}
        onClick={(e) => onClick(item, e)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        {...dragHandlers}
      >
        {item.locked && <span className="cell-lock-icon">&#128274;</span>}
        <button
          className="cell-lock-btn"
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          title={item.locked ? 'Unlock' : 'Lock'}
        >
          {item.locked ? '\u{1F512}' : '\u{1F513}'}
        </button>
        {isUpgrade && <span className="cell-upgrade-indicator">&#9650;</span>}

        <Icon size={32} color={color} className="cell-icon" />

        <div className="cell-bottom">
          <span className="cell-level">Lv.{item.itemLevel}</span>
          {dpsDeltaStr && (
            <span className={`cell-dps-delta ${upgradePct > 0.02 ? 'positive' : 'negative'}`}>
              {dpsDeltaStr}
            </span>
          )}
        </div>
      </div>

      {tooltipPos && (
        <ItemDetailTooltip item={item} position={tooltipPos} />
      )}
    </>
  );
}
