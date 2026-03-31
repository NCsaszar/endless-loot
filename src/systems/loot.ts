import type { Item, Rarity, EquipSlot, PrimaryStat, MaterialType } from '../types';
import { ALL_EQUIP_SLOTS, RARITY_ORDER } from '../types';
import { getBaseItemsForSlot } from '../data/items';
import { itemSellValue, lukRarityShift, lukDropChance, lukBossMinRarityIndex } from '../data/formulas';
import { rollAffixes } from '../data/affixes';

// --- Rarity Config ---

interface RarityConfig {
  dropWeight: number;
  statMultiplier: number;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common:    { dropWeight: 50, statMultiplier: 1.0 },
  uncommon:  { dropWeight: 30, statMultiplier: 1.3 },
  rare:      { dropWeight: 14, statMultiplier: 1.7 },
  epic:      { dropWeight: 5,  statMultiplier: 2.2 },
  legendary: { dropWeight: 1,  statMultiplier: 3.0 },
};

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const PRIMARY_STATS: PrimaryStat[] = ['str', 'dex', 'int', 'vit', 'luk'];

// --- Salvage Mapping ---

export const SALVAGE_MAP: Record<Rarity, { material: MaterialType; amount: number }> = {
  common:    { material: 'scrap', amount: 1 },
  uncommon:  { material: 'fragments', amount: 1 },
  rare:      { material: 'crystals', amount: 1 },
  epic:      { material: 'essences', amount: 1 },
  legendary: { material: 'legendaryShards', amount: 1 },
};

// --- Helpers ---

let nextItemId = 1;

function generateItemId(): string {
  return `item_${Date.now()}_${nextItemId++}`;
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Roll Rarity ---

function rollRarity(minRarity?: Rarity, luk: number = 0, zoneRarityBonus: number = 0): Rarity {
  const minIndex = minRarity ? RARITIES.indexOf(minRarity) : 0;
  const eligible = RARITIES.slice(minIndex);
  const shift = lukRarityShift(luk);
  const weights = eligible.map(r => {
    const base = RARITY_CONFIG[r].dropWeight;
    return r === 'common' ? base : base * shift * (1 + zoneRarityBonus);
  });
  return weightedRandom(eligible, weights);
}

// --- Roll Random Primary Stat ---

function rollRandomPrimaryStat(itemLevel: number, rarityMultiplier: number): { stat: PrimaryStat; value: number } {
  const stat = pickRandom(PRIMARY_STATS);
  const value = Math.floor((randomInt(1, 3) + Math.floor(itemLevel * 0.3)) * rarityMultiplier);
  return { stat, value };
}

// --- Generate a Single Item ---

export function generateItem(itemLevel: number, minRarity?: Rarity, luk: number = 0, zoneRarityBonus: number = 0): Item {
  const slot: EquipSlot = pickRandom(ALL_EQUIP_SLOTS);
  const rarity = rollRarity(minRarity, luk, zoneRarityBonus);
  const config = RARITY_CONFIG[rarity];

  const baseItems = getBaseItemsForSlot(slot);
  const baseDef = pickRandom(baseItems);

  const primaryStatValue = Math.floor(
    baseDef.basePrimaryStat * (1 + 0.2 * itemLevel) * config.statMultiplier
  );

  const { stat: randomPrimaryStat, value: randomPrimaryStatValue } = rollRandomPrimaryStat(itemLevel, config.statMultiplier);
  const { prefixes, suffixes } = rollAffixes(itemLevel, rarity, luk);

  return {
    id: generateItemId(),
    name: baseDef.name,
    slot,
    rarity,
    itemLevel,
    primaryStatValue,
    randomPrimaryStat,
    randomPrimaryStatValue,
    prefixes,
    suffixes,
    sellValue: itemSellValue(rarity, itemLevel),
    salvageResult: SALVAGE_MAP[rarity],
    locked: false,
  };
}

// --- Should Drop Loot? ---

export function shouldDropLoot(isBoss: boolean, luk: number = 0): boolean {
  if (isBoss) return true;
  return Math.random() < lukDropChance(luk);
}

// --- Generate Boss Loot (guaranteed rare+ or better with LUK) ---

export function generateBossLoot(itemLevel: number, luk: number = 0, zoneRarityBonus: number = 0): Item {
  const minRarityIdx = lukBossMinRarityIndex(luk);
  const minRarity = RARITY_ORDER[minRarityIdx];
  return generateItem(itemLevel, minRarity, luk, zoneRarityBonus);
}
