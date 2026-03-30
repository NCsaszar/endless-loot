import type { Item, Rarity, EquipSlot, BonusStat, BonusStatType, MaterialType } from '../types';
import { ALL_EQUIP_SLOTS } from '../types';
import { getBaseItemsForSlot } from '../data/items';
import { itemSellValue } from '../data/formulas';

// --- Rarity Config ---

interface RarityConfig {
  dropWeight: number;
  statMultiplier: number;
  bonusStatCount: [number, number]; // [min, max]
}

const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common:    { dropWeight: 50, statMultiplier: 1.0, bonusStatCount: [0, 0] },
  uncommon:  { dropWeight: 30, statMultiplier: 1.3, bonusStatCount: [1, 1] },
  rare:      { dropWeight: 14, statMultiplier: 1.7, bonusStatCount: [1, 2] },
  epic:      { dropWeight: 5,  statMultiplier: 2.2, bonusStatCount: [2, 3] },
  legendary: { dropWeight: 1,  statMultiplier: 3.0, bonusStatCount: [3, 3] },
};

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const BONUS_STAT_POOL: BonusStatType[] = [
  'str', 'dex', 'int', 'vit', 'critChance', 'dodgeChance', 'hp', 'defense',
];

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

function rollRarity(minRarity?: Rarity): Rarity {
  const minIndex = minRarity ? RARITIES.indexOf(minRarity) : 0;
  const eligible = RARITIES.slice(minIndex);
  const weights = eligible.map(r => RARITY_CONFIG[r].dropWeight);
  return weightedRandom(eligible, weights);
}

// --- Roll Bonus Stats ---

function rollBonusStats(rarity: Rarity, itemLevel: number): BonusStat[] {
  const config = RARITY_CONFIG[rarity];
  const count = randomInt(config.bonusStatCount[0], config.bonusStatCount[1]);
  const stats: BonusStat[] = [];
  const usedTypes = new Set<BonusStatType>();

  for (let i = 0; i < count; i++) {
    // Pick a stat type not already used on this item
    const available = BONUS_STAT_POOL.filter(t => !usedTypes.has(t));
    if (available.length === 0) break;
    const type = pickRandom(available);
    usedTypes.add(type);

    let value: number;
    if (type === 'critChance' || type === 'dodgeChance') {
      // Percentage-based: 0.01 to 0.05 scaled by level
      value = parseFloat((0.01 + Math.random() * 0.04 * (1 + itemLevel * 0.1)).toFixed(3));
    } else if (type === 'hp') {
      value = randomInt(5, 15) + Math.floor(itemLevel * 2);
    } else if (type === 'defense') {
      value = randomInt(1, 5) + Math.floor(itemLevel * 0.5);
    } else {
      // Primary stat bonus: str, dex, int, vit
      value = randomInt(1, 3) + Math.floor(itemLevel * 0.3);
    }

    stats.push({ type, value });
  }

  return stats;
}

// --- Generate a Single Bonus Stat (for enchanting) ---

export function generateSingleBonusStat(itemLevel: number, existingTypes: BonusStatType[]): BonusStat | null {
  const available = BONUS_STAT_POOL.filter(t => !existingTypes.includes(t));
  if (available.length === 0) return null;
  const type = pickRandom(available);
  let value: number;
  if (type === 'critChance' || type === 'dodgeChance') {
    value = parseFloat((0.01 + Math.random() * 0.04 * (1 + itemLevel * 0.1)).toFixed(3));
  } else if (type === 'hp') {
    value = randomInt(5, 15) + Math.floor(itemLevel * 2);
  } else if (type === 'defense') {
    value = randomInt(1, 5) + Math.floor(itemLevel * 0.5);
  } else {
    value = randomInt(1, 3) + Math.floor(itemLevel * 0.3);
  }
  return { type, value };
}

// --- Enchanted Name Generation ---

const RARITY_PREFIXES: Record<Rarity, string[]> = {
  common: [],
  uncommon: ['Fine', 'Keen', 'Sturdy'],
  rare: ['Superior', 'Masterwork', 'Exquisite'],
  epic: ['Mythic', 'Arcane', 'Transcendent'],
  legendary: ['Godforged', 'Eternal', 'Primordial'],
};

export function generateEnchantedName(baseName: string, newRarity: Rarity): string {
  const prefixes = RARITY_PREFIXES[newRarity];
  if (prefixes.length === 0) return baseName;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix} ${baseName}`;
}

// --- Affix Map (exported for enchanting) ---

export const AFFIX_MAP: Record<BonusStatType, string> = {
  str: 'of Might',
  dex: 'of Agility',
  int: 'of Wisdom',
  vit: 'of Vitality',
  critChance: 'of Precision',
  dodgeChance: 'of Evasion',
  hp: 'of Endurance',
  defense: 'of Fortitude',
};

// --- Generate a Single Item ---

export function generateItem(itemLevel: number, minRarity?: Rarity): Item {
  const slot: EquipSlot = pickRandom(ALL_EQUIP_SLOTS);
  const rarity = rollRarity(minRarity);
  const config = RARITY_CONFIG[rarity];

  const baseItems = getBaseItemsForSlot(slot);
  const baseDef = pickRandom(baseItems);

  const primaryStatValue = Math.floor(
    baseDef.basePrimaryStat * (1 + 0.2 * itemLevel) * config.statMultiplier
  );

  const bonusStats = rollBonusStats(rarity, itemLevel);

  // Generate name with affix for uncommon+
  let name = baseDef.name;
  if (rarity !== 'common' && bonusStats.length > 0) {
    name = `${baseDef.name} ${AFFIX_MAP[bonusStats[0].type]}`;
  }

  return {
    id: generateItemId(),
    name,
    slot,
    rarity,
    itemLevel,
    primaryStatValue,
    bonusStats,
    sellValue: itemSellValue(rarity, itemLevel),
    salvageResult: SALVAGE_MAP[rarity],
    locked: false,
  };
}

// --- Should Drop Loot? ---

export function shouldDropLoot(isBoss: boolean): boolean {
  if (isBoss) return true;
  return Math.random() < 0.6; // 60% drop rate for regular mobs
}

// --- Generate Boss Loot (guaranteed rare+) ---

export function generateBossLoot(itemLevel: number): Item {
  return generateItem(itemLevel, 'rare');
}
