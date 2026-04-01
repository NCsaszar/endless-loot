import { useState, useCallback } from 'react';
import type { EquipSlot, Equipment } from '../types';
import { SLOT_LABELS, RARITY_COLORS } from '../types';
import { SLOT_ICONS } from './icons';
import { computeTooltipPosition } from '../utils/tooltipPosition';
import ItemDetailTooltip from './ItemDetailTooltip';

const LEFT_SLOTS: EquipSlot[] = ['helmet', 'chest', 'legs', 'boots'];
const RIGHT_SLOTS: EquipSlot[] = ['weapon', 'offhand', 'ring', 'amulet'];

interface EquipmentPaperDollProps {
  equipment: Equipment;
  dropHandlers: (slot: EquipSlot) => {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
  dragOverSlot: EquipSlot | null;
  lastEquippedSlot: EquipSlot | null;
  onSlotClick: (slot: EquipSlot) => void;
}

export default function EquipmentPaperDoll({
  equipment, dropHandlers, dragOverSlot, lastEquippedSlot, onSlotClick,
}: EquipmentPaperDollProps) {
  const [hoverTooltip, setHoverTooltip] = useState<{ slot: EquipSlot; pos: { x: number; y: number } } | null>(null);

  const handleSlotHover = useCallback((slot: EquipSlot, el: HTMLElement | null) => {
    if (!el || !equipment[slot]) { setHoverTooltip(null); return; }
    const rect = el.getBoundingClientRect();
    setHoverTooltip({ slot, pos: computeTooltipPosition(rect) });
  }, [equipment]);

  const renderSlot = (slot: EquipSlot) => {
    const item = equipment[slot];
    const handlers = dropHandlers(slot);
    const isDragOver = dragOverSlot === slot;
    const justEquipped = lastEquippedSlot === slot;
    const Icon = SLOT_ICONS[slot];

    return (
      <div
        key={slot}
        className={`doll-slot ${item ? 'filled' : 'empty'} ${isDragOver ? 'drag-over' : ''} ${justEquipped ? 'just-equipped' : ''}`}
        style={item ? { borderColor: RARITY_COLORS[item.rarity] } : undefined}
        onClick={() => onSlotClick(slot)}
        onMouseEnter={(e) => handleSlotHover(slot, e.currentTarget)}
        onMouseLeave={() => setHoverTooltip(null)}
        {...handlers}
      >
        <div className="doll-slot-label">{SLOT_LABELS[slot]}</div>
        {item ? (
          <div className="doll-slot-item">
            <Icon size={24} color={RARITY_COLORS[item.rarity]} />
            <span className="doll-slot-level">Lv.{item.itemLevel}</span>
          </div>
        ) : (
          <div className="doll-slot-empty">
            <Icon size={24} color="currentColor" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="equipment-paper-doll">
      <div className="doll-column doll-left">
        {LEFT_SLOTS.map(slot => renderSlot(slot))}
      </div>
      <div className="doll-center">
        <img src="/portraits/hero.svg" alt="Hero" className="doll-portrait" />
      </div>
      <div className="doll-column doll-right">
        {RIGHT_SLOTS.map(slot => renderSlot(slot))}
      </div>

      {hoverTooltip && equipment[hoverTooltip.slot] && (
        <ItemDetailTooltip
          item={equipment[hoverTooltip.slot]!}
          position={hoverTooltip.pos}
        />
      )}
    </div>
  );
}
