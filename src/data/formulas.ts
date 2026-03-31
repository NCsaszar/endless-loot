import type { PrimaryStats, PrimaryStat, DerivedStats, Equipment, Character, AffixId } from '../types';

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

// --- LUK Effect Formulas (all with diminishing returns) ---

/** Multiplier on uncommon+ rarity drop weights */
export function lukRarityShift(luk: number): number {
  return 1 + 2 * (1 - 1 / (1 + luk / 40));
}

/** Gold find multiplier (mob gold + sell values) */
export function lukGoldMultiplier(luk: number): number {
  return 1 + 0.5 * Math.log(1 + luk / 50);
}

/** Affix value roll multiplier (replaces old lukBonusStatMultiplier) */
export function lukAffixMultiplier(luk: number): number {
  return 1 + 0.8 * (1 - 1 / (1 + luk / 60));
}

/** Drop chance for regular mobs (base 60%, cap ~95%) */
export function lukDropChance(luk: number): number {
  return 0.60 + 0.35 * (1 - 1 / (1 + luk / 80));
}

/** Boss minimum rarity index (0=common..4=legendary). Base is 2 (rare). */
export function lukBossMinRarityIndex(luk: number): number {
  return Math.min(4, Math.floor(2 + 2 * (1 - 1 / (1 + luk / 100))));
}

// --- XP Curve ---

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.7));
}

// --- Sum affix percentages from all equipped items ---

export function sumAffixPercent(equipment: Equipment, affixId: AffixId): number {
  let total = 0;
  for (const item of Object.values(equipment)) {
    if (!item) continue;
    for (const affix of [...item.prefixes, ...item.suffixes]) {
      if (affix && affix.id === affixId) total += affix.value;
    }
  }
  return total;
}

// --- Get Total Primary Stats (base + gear) ---
// % affixes multiply character sheet (base) only, flat gear bonuses are added after.

export function getTotalPrimaryStats(
  character: Character,
  equipment: Equipment,
): PrimaryStats {
  const stats: PrimaryStat[] = ['str', 'dex', 'int', 'vit', 'luk'];
  const total: PrimaryStats = { str: 0, dex: 0, int: 0, vit: 0, luk: 0 };

  for (const stat of stats) {
    const characterSheet = character.baseStats[stat];
    const percentBonus = sumAffixPercent(equipment, stat as AffixId);

    // Sum flat gear bonuses from randomPrimaryStat
    let flatGearBonus = 0;
    for (const item of Object.values(equipment)) {
      if (!item) continue;
      if (item.randomPrimaryStat === stat) {
        flatGearBonus += item.randomPrimaryStatValue;
      }
    }

    total[stat] = Math.floor(characterSheet * (1 + percentBonus) + flatGearBonus);
  }

  return total;
}

// --- Calculate Derived Stats ---

export function calculateDerivedStats(
  primaryStats: PrimaryStats,
  equipment: Equipment,
): DerivedStats {
  // Sum up gear primary stat contributions (slot-specific ATK/DEF)
  let gearAtk = 0;
  let gearDef = 0;

  for (const item of Object.values(equipment)) {
    if (!item) continue;
    if (item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet') {
      gearAtk += item.primaryStatValue;
    } else {
      gearDef += item.primaryStatValue;
    }
  }

  // Calculate each derived stat: base + primary scaling + flat gear, then * (1 + affix%)
  const atkPercent = sumAffixPercent(equipment, 'attackPower');
  const spdPercent = sumAffixPercent(equipment, 'attackSpeed');
  const critPercent = sumAffixPercent(equipment, 'critChance');
  const critDmgPercent = sumAffixPercent(equipment, 'critDamage');
  const lifePercent = sumAffixPercent(equipment, 'maxLife');
  const defPercent = sumAffixPercent(equipment, 'defense');
  const dodgePercent = sumAffixPercent(equipment, 'dodgeChance');
  const regenPercent = sumAffixPercent(equipment, 'hpRegen');
  const goldFindPercent = sumAffixPercent(equipment, 'goldFind');
  const xpGainPercent = sumAffixPercent(equipment, 'xpGain');
  const lootRarityPercent = sumAffixPercent(equipment, 'lootRarity');

  return {
    attackPower: (BASE_ATK + primaryStats.str * STR_TO_ATK + gearAtk) * (1 + atkPercent),
    attackSpeed: Math.min(3, (BASE_SPEED + primaryStats.dex * DEX_TO_SPEED) * (1 + spdPercent)),
    critChance: Math.min(0.75, (BASE_CRIT + primaryStats.dex * DEX_TO_CRIT) * (1 + critPercent)),
    critDamage: BASE_CRIT_DMG * (1 + critDmgPercent),
    maxHp: (BASE_HP + primaryStats.vit * VIT_TO_HP) * (1 + lifePercent),
    defense: (BASE_DEF + primaryStats.vit * VIT_TO_DEF + gearDef) * (1 + defPercent),
    dodgeChance: Math.min(0.5, (BASE_DODGE + primaryStats.dex * DEX_TO_DODGE) * (1 + dodgePercent)),
    hpRegen: (BASE_REGEN + primaryStats.vit * VIT_TO_REGEN) * (1 + regenPercent),
    goldFind: 1 + goldFindPercent,
    xpGainBonus: 1 + xpGainPercent,
    lootRarityBonus: lootRarityPercent,
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
  unique: 0,
};

export function itemSellValue(rarity: string, itemLevel: number): number {
  return Math.floor((SELL_BASE[rarity] ?? 5) * (1 + 0.1 * itemLevel));
}
