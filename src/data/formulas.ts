import type { PrimaryStats, DerivedStats, Equipment, Character, TrainingLevels, Rarity } from '../types';
import { RARITY_ORDER } from '../types';

// --- Stat Scaling Constants ---

const STR_TO_ATK = 2.5;
const DEX_TO_SPEED = 0.008; // attack speed bonus per DEX
const DEX_TO_CRIT = 0.003; // crit chance per DEX
const DEX_TO_DODGE = 0.002; // dodge chance per DEX
const VIT_TO_HP = 8;
const VIT_TO_DEF = 1.2;
const VIT_TO_REGEN = 0.3; // HP regen per second per VIT

// --- Base Stats (level 1, no gear) ---

const BASE_ATK = 5;
const BASE_SPEED = 0.8; // attacks per second
const BASE_CRIT = 0.05; // 5%
const BASE_CRIT_DMG = 1.5; // 150%
const BASE_HP = 50;
const BASE_DEF = 2;
const BASE_DODGE = 0.02; // 2%
const BASE_REGEN = 1; // HP per second

// --- XP Curve ---

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// --- Training Cost ---

export function trainingCost(currentTrainingLevel: number): number {
  return Math.floor(100 * Math.pow(currentTrainingLevel + 1, 2));
}

// --- Get Total Primary Stats (base + training + gear bonuses) ---

export function getTotalPrimaryStats(
  character: Character,
  trainingLevels: TrainingLevels,
  equipment: Equipment,
): PrimaryStats {
  const total: PrimaryStats = {
    str: character.baseStats.str + trainingLevels.str,
    dex: character.baseStats.dex + trainingLevels.dex,
    int: character.baseStats.int + trainingLevels.int,
    vit: character.baseStats.vit + trainingLevels.vit,
  };

  // Add gear bonus stats
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    for (const bonus of item.bonusStats) {
      if (bonus.type === 'str') total.str += bonus.value;
      if (bonus.type === 'dex') total.dex += bonus.value;
      if (bonus.type === 'int') total.int += bonus.value;
      if (bonus.type === 'vit') total.vit += bonus.value;
    }
  }

  return total;
}

// --- Calculate Derived Stats ---

export function calculateDerivedStats(
  primaryStats: PrimaryStats,
  equipment: Equipment,
): DerivedStats {
  // Sum up gear primary stat contributions
  let gearAtk = 0;
  let gearDef = 0;
  let gearHp = 0;
  let gearCrit = 0;
  let gearDodge = 0;
  let gearSpeed = 0;

  for (const item of Object.values(equipment)) {
    if (!item) continue;

    // Primary stat from gear slot
    if (item.slot === 'weapon') {
      gearAtk += item.primaryStatValue;
    } else if (item.slot === 'ring' || item.slot === 'amulet') {
      // Accessories can be ATK or DEF — for simplicity, treat as ATK
      gearAtk += item.primaryStatValue;
    } else {
      // Armor slots: offhand, helmet, chest, legs, boots
      gearDef += item.primaryStatValue;
    }

    // Bonus stats from gear
    for (const bonus of item.bonusStats) {
      if (bonus.type === 'hp') gearHp += bonus.value;
      if (bonus.type === 'defense') gearDef += bonus.value;
      if (bonus.type === 'critChance') gearCrit += bonus.value;
      if (bonus.type === 'dodgeChance') gearDodge += bonus.value;
    }
  }

  // Check for boots speed bonus
  const boots = equipment.boots;
  if (boots) {
    for (const bonus of boots.bonusStats) {
      if (bonus.type === 'dex') gearSpeed += bonus.value * DEX_TO_SPEED;
    }
  }

  return {
    attackPower: BASE_ATK + primaryStats.str * STR_TO_ATK + gearAtk,
    attackSpeed: Math.min(3, BASE_SPEED + primaryStats.dex * DEX_TO_SPEED + gearSpeed), // cap at 3 attacks/sec
    critChance: Math.min(0.75, BASE_CRIT + primaryStats.dex * DEX_TO_CRIT + gearCrit),
    critDamage: BASE_CRIT_DMG,
    maxHp: BASE_HP + primaryStats.vit * VIT_TO_HP + gearHp,
    defense: BASE_DEF + primaryStats.vit * VIT_TO_DEF + gearDef,
    dodgeChance: Math.min(0.5, BASE_DODGE + primaryStats.dex * DEX_TO_DODGE + gearDodge),
    hpRegen: BASE_REGEN + primaryStats.vit * VIT_TO_REGEN,
  };
}

// --- Mob Stat Scaling ---

export function scaleMobStat(baseStat: number, level: number): number {
  return Math.floor(baseStat * (1 + 0.15 * level));
}

// --- Mob XP/Gold Reward ---

export function mobXpReward(mobBaseXp: number, mobLevel: number, zoneNumber: number, isBoss: boolean): number {
  const base = Math.floor(mobBaseXp * mobLevel * (1 + 0.1 * zoneNumber));
  return isBoss ? Math.floor(base * 1.5) : base;
}

export function mobGoldReward(mobBaseGold: number, mobLevel: number, zoneNumber: number, isBoss: boolean): number {
  const base = Math.floor(mobBaseGold * mobLevel * (1 + 0.15 * zoneNumber));
  return isBoss ? base * 3 : base;
}

// --- Sell Value ---

const SELL_BASE: Record<string, number> = {
  common: 5,
  uncommon: 15,
  rare: 50,
  epic: 200,
  legendary: 1000,
};

export function itemSellValue(rarity: string, itemLevel: number): number {
  return Math.floor((SELL_BASE[rarity] ?? 5) * (1 + 0.1 * itemLevel));
}

// --- Enchanting Cost ---

export interface EnchantCost {
  scrap: number;
  fragments: number;
}

export function enchantCost(currentRarity: Rarity): EnchantCost | null {
  const idx = RARITY_ORDER.indexOf(currentRarity);
  if (idx >= RARITY_ORDER.length - 1) return null; // legendary can't upgrade
  const base = Math.pow(5, idx + 1);
  return {
    scrap: Math.floor(base * 2),
    fragments: Math.floor(base),
  };
}
