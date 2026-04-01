import type { Item } from '../types';
import InventoryItemCell from './InventoryItemCell';

interface InventoryBagGridProps {
  items: Item[];
  selectedId: string | null;
  upgradeMap: Map<string, number>;
  newLootIds: Set<string>;
  draggedItemId: string | null;
  dragHandlers: (itemId: string) => {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: () => void;
  };
  onItemClick: (item: Item, e: React.MouseEvent) => void;
  onToggleLock: (itemId: string) => void;
  totalSlots: number;
}

export default function InventoryBagGrid({
  items, selectedId, upgradeMap, newLootIds, draggedItemId,
  dragHandlers, onItemClick, onToggleLock, totalSlots,
}: InventoryBagGridProps) {
  const emptySlotCount = Math.max(0, totalSlots - items.length);

  return (
    <div className="inv-bag-grid-wrapper">
      <div className="inv-bag-grid">
        {items.map(item => (
          <InventoryItemCell
            key={item.id}
            item={item}
            selected={item.id === selectedId}
            upgradePct={upgradeMap.get(item.id) ?? 0}
            isNewLoot={newLootIds.has(item.id)}
            dragHandlers={dragHandlers(item.id)}
            isDragging={draggedItemId === item.id}
            onClick={onItemClick}
            onToggleLock={() => onToggleLock(item.id)}
          />
        ))}
        {Array.from({ length: emptySlotCount }, (_, i) => (
          <div key={`empty-${i}`} className="inv-cell-v2 empty" />
        ))}
      </div>
    </div>
  );
}
