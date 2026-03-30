import type { GameState, Item } from '../types';
import { RARITY_ORDER } from '../types';
import { trainingCost, enchantCost, itemSellValue } from '../data/formulas';
import { generateSingleBonusStat, generateEnchantedName, SALVAGE_MAP, AFFIX_MAP } from './loot';

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

export function trainStat(state: GameState, stat: 'str' | 'dex' | 'int' | 'vit' | 'luk'): boolean {
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

export function bulkSell(state: GameState, itemIds: string[]): void {
  const idSet = new Set(itemIds);
  state.inventory = state.inventory.filter(item => {
    if (!idSet.has(item.id) || item.locked) return true;
    state.gold += item.sellValue;
    state.totalGoldEarned += item.sellValue;
    return false;
  });
}

export function bulkSalvage(state: GameState, itemIds: string[]): void {
  const idSet = new Set(itemIds);
  state.inventory = state.inventory.filter(item => {
    if (!idSet.has(item.id) || item.locked) return true;
    state.materials[item.salvageResult.material] += item.salvageResult.amount;
    return false;
  });
}

export function enchantItem(state: GameState, itemId: string): boolean {
  let item: Item | undefined = state.inventory.find(i => i.id === itemId)
    ?? Object.values(state.equipment).find(i => i?.id === itemId) as Item | undefined;
  if (!item) return false;

  const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
  if (rarityIdx >= RARITY_ORDER.length - 1) return false;

  const cost = enchantCost(item.rarity);
  if (!cost) return false;
  if (state.materials.scrap < cost.scrap || state.materials.fragments < cost.fragments) return false;

  // Deduct materials
  state.materials.scrap -= cost.scrap;
  state.materials.fragments -= cost.fragments;

  // Upgrade rarity
  const newRarity = RARITY_ORDER[rarityIdx + 1];
  item.rarity = newRarity;

  // Add one bonus stat
  const existingTypes = item.bonusStats.map(b => b.type);
  const newStat = generateSingleBonusStat(item.itemLevel, existingTypes);
  if (newStat) item.bonusStats.push(newStat);

  // Strip existing prefix and affix to get base name
  const prefixPattern = /^(Fine|Keen|Sturdy|Superior|Masterwork|Exquisite|Mythic|Arcane|Transcendent|Godforged|Eternal|Primordial) /;
  const affixPattern = / of (Might|Agility|Wisdom|Vitality|Fortune|Precision|Evasion|Endurance|Fortitude)$/;
  const baseName = item.name.replace(prefixPattern, '').replace(affixPattern, '');

  // Build new name with rarity prefix
  let newName = generateEnchantedName(baseName, newRarity);

  // Reapply affix from first bonus stat
  if (item.bonusStats.length > 0) {
    newName += ` ${AFFIX_MAP[item.bonusStats[0].type]}`;
  }
  item.name = newName;

  // Update sell value and salvage result
  item.sellValue = itemSellValue(newRarity, item.itemLevel);
  item.salvageResult = SALVAGE_MAP[newRarity];

  return true;
}
