import { useState, useCallback } from 'react';
import type { EquipSlot, Item } from '../types';

interface DragEquipState {
  draggedItemId: string | null;
  dragOverSlot: EquipSlot | null;
}

export function useDragEquip(
  inventory: Item[],
  onEquip: (item: Item) => void,
) {
  const [dragState, setDragState] = useState<DragEquipState>({
    draggedItemId: null,
    dragOverSlot: null,
  });

  const getDraggedItem = useCallback(() => {
    if (!dragState.draggedItemId) return null;
    return inventory.find(i => i.id === dragState.draggedItemId) ?? null;
  }, [dragState.draggedItemId, inventory]);

  const dragHandlers = useCallback((itemId: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', itemId);
      e.dataTransfer.effectAllowed = 'move';
      setDragState(s => ({ ...s, draggedItemId: itemId }));
    },
    onDragEnd: () => {
      setDragState({ draggedItemId: null, dragOverSlot: null });
    },
  }), []);

  const dropHandlers = useCallback((slot: EquipSlot) => ({
    onDragOver: (e: React.DragEvent) => {
      const draggedItem = getDraggedItem();
      if (draggedItem && draggedItem.slot === slot) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragState(s => ({ ...s, dragOverSlot: slot }));
      }
    },
    onDragEnter: (e: React.DragEvent) => {
      const draggedItem = getDraggedItem();
      if (draggedItem && draggedItem.slot === slot) {
        e.preventDefault();
        setDragState(s => ({ ...s, dragOverSlot: slot }));
      }
    },
    onDragLeave: () => {
      setDragState(s => s.dragOverSlot === slot ? { ...s, dragOverSlot: null } : s);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const itemId = e.dataTransfer.getData('text/plain');
      const item = inventory.find(i => i.id === itemId);
      if (item && item.slot === slot) {
        onEquip(item);
      }
      setDragState({ draggedItemId: null, dragOverSlot: null });
    },
  }), [getDraggedItem, inventory, onEquip]);

  return { dragState, dragHandlers, dropHandlers };
}
