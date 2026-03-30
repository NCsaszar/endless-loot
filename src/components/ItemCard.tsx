import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Item } from '../types';
import { RARITY_COLORS } from '../types';
import { SLOT_ICONS } from './icons';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  grid?: boolean;
  upgradePct?: number;
  onToggleLock?: () => void;
}

export default function ItemCard({ item, onClick, selected, compact, grid, upgradePct, onToggleLock }: ItemCardProps) {
  const color = RARITY_COLORS[item.rarity];
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const tooltipWidth = 210; // approximate width (min 180, max 240)
    const halfW = tooltipWidth / 2;
    const x = Math.max(halfW + 4, Math.min(window.innerWidth - halfW - 4, rect.left + rect.width / 2));
    setTooltipPos({ x, y: rect.top });
  }, []);

  const hideTooltip = useCallback(() => setTooltipPos(null), []);

  if (grid) {
    const isUpgrade = (upgradePct ?? 0) > 0.02;
    const isBigUpgrade = (upgradePct ?? 0) > 0.10;
    return (
      <>
        <div
          ref={cardRef}
          className={`item-card grid ${selected ? 'selected' : ''} ${isBigUpgrade ? 'upgrade-glow' : ''} ${item.locked ? 'locked' : ''}`}
          style={{ borderColor: color }}
          onClick={onClick}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
        >
          {item.locked && <span className="lock-icon">&#128274;</span>}
          {onToggleLock && (
            <button
              className="lock-btn"
              onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
              title={item.locked ? 'Unlock' : 'Lock'}
            >
              {item.locked ? '\u{1F512}' : '\u{1F513}'}
            </button>
          )}
          {isUpgrade && <span className="upgrade-indicator">&#9650;</span>}
          {(() => { const Icon = SLOT_ICONS[item.slot]; return <Icon size={20} color={color} className="grid-icon" />; })()}
          <span className="grid-level">Lv.{item.itemLevel}</span>
        </div>
        {tooltipPos && createPortal(
          <div
            className="item-tooltip"
            style={{
              borderColor: color,
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <div className="tooltip-name" style={{ color }}>{item.name}</div>
            <div className="tooltip-meta">{item.slot} &middot; Lv.{item.itemLevel} &middot; <span style={{ color }}>({item.rarity})</span></div>
            <div className="tooltip-stat">
              Primary: +{item.primaryStatValue} {item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet' ? 'ATK' : 'DEF'}
            </div>
            {item.bonusStats.length > 0 && (
              <div className="tooltip-bonuses">
                {item.bonusStats.map((b, i) => (
                  <div key={i}>
                    +{b.type === 'critChance' || b.type === 'dodgeChance'
                      ? `${(b.value * 100).toFixed(1)}% ${b.type === 'critChance' ? 'Crit' : 'Dodge'}`
                      : `${b.value} ${b.type.toUpperCase()}`}
                  </div>
                ))}
              </div>
            )}
            <div className="tooltip-value">{item.sellValue}g</div>
          </div>,
          document.body
        )}
      </>
    );
  }

  if (compact) {
    return (
      <div
        className={`item-card compact ${selected ? 'selected' : ''}`}
        style={{ borderColor: color }}
        onClick={onClick}
      >
        {(() => { const Icon = SLOT_ICONS[item.slot]; return <Icon size={16} color={color} />; })()}
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
