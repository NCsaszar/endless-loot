import type { GameState, Item } from '../types';
import { trainingCost } from '../data/formulas';

export function sellItem(state: GameState, itemId: string): boolean {
  const idx = state.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return false;
  const item = state.inventory[idx];
  if (item.locked) return false;
  state.gold += item.sellValue;
  state.totalGoldEarned += item.sellValue;
  state.inventory.splice(idx, 1);
  return true;
}

export function salvageItem(state: GameState, itemId: string): boolean {
  const idx = state.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return false;
  const item = state.inventory[idx];
  if (item.locked) return false;
  state.materials[item.salvageResult.material] += item.salvageResult.amount;
  state.inventory.splice(idx, 1);
  return true;
}

export function trainStat(state: GameState, stat: 'str' | 'dex' | 'int' | 'vit'): boolean {
  const currentLevel = state.trainingLevels[stat];
  const cost = trainingCost(currentLevel);
  if (state.gold < cost) return false;
  state.gold -= cost;
  state.trainingLevels[stat]++;
  state.character.trainingStats[stat]++;
  return true;
}

export function equipItem(state: GameState, item: Item): Item | null {
  const prev = state.equipment[item.slot] ?? null;
  state.equipment[item.slot] = item;

  // Remove from inventory
  const idx = state.inventory.findIndex(i => i.id === item.id);
  if (idx !== -1) state.inventory.splice(idx, 1);

  // Put previous item back in inventory
  if (prev) state.inventory.push(prev);

  return prev;
}

export function unequipItem(state: GameState, slot: Item['slot']): boolean {
  const item = state.equipment[slot];
  if (!item) return false;
  state.inventory.push(item);
  delete state.equipment[slot];
  return true;
}
