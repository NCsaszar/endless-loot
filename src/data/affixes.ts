import type { AffixId, AffixSlotType, Affix, Rarity } from '../types';

// --- Affix Definition ---

export interface AffixTierRange {
  min: number; // percentage as decimal (0.03 = 3%)
  max: number;
}

export interface AffixDef {
  id: AffixId;
  slotType: AffixSlotType;
  displayName: string;
  tiers: AffixTierRange[]; // index 0 = T1, index 9 = T10
}

// --- Tier Level Thresholds ---
// Item level required to access each tier

export const TIER_LEVEL_THRESHOLDS = [1, 4, 7, 10, 14, 20, 30, 50, 80, 120];

export function getMaxTier(itemLevel: number): number {
  let maxTier = 1;
  for (let i = 0; i < TIER_LEVEL_THRESHOLDS.length; i++) {
    if (itemLevel >= TIER_LEVEL_THRESHOLDS[i]) maxTier = i + 1;
  }
  return maxTier;
}

// --- Rarity Affix Value Multiplier ---

export const RARITY_AFFIX_MULTIPLIER: Record<Rarity, number> = {
  common: 0.7,
  uncommon: 0.85,
  rare: 1.0,
  epic: 1.2,
  legendary: 1.5,
};

// --- Prefix Pool (Offensive — 4 affixes) ---

export const PREFIX_POOL: AffixDef[] = [
  {
    id: 'attackPower',
    slotType: 'prefix',
    displayName: '% Increased Attack Power',
    tiers: [
      { min: 0.03, max: 0.05 },
      { min: 0.06, max: 0.10 },
      { min: 0.11, max: 0.16 },
      { min: 0.17, max: 0.22 },
      { min: 0.23, max: 0.30 },
      { min: 0.31, max: 0.38 },
      { min: 0.39, max: 0.47 },
      { min: 0.48, max: 0.57 },
      { min: 0.58, max: 0.68 },
      { min: 0.69, max: 0.80 },
    ],
  },
  {
    id: 'attackSpeed',
    slotType: 'prefix',
    displayName: '% Increased Attack Speed',
    tiers: [
      { min: 0.02, max: 0.04 },
      { min: 0.05, max: 0.08 },
      { min: 0.09, max: 0.12 },
      { min: 0.13, max: 0.17 },
      { min: 0.18, max: 0.24 },
      { min: 0.25, max: 0.31 },
      { min: 0.32, max: 0.39 },
      { min: 0.40, max: 0.48 },
      { min: 0.49, max: 0.58 },
      { min: 0.59, max: 0.70 },
    ],
  },
  {
    id: 'critChance',
    slotType: 'prefix',
    displayName: '% Increased Critical Chance',
    tiers: [
      { min: 0.01, max: 0.03 },
      { min: 0.04, max: 0.06 },
      { min: 0.07, max: 0.10 },
      { min: 0.11, max: 0.14 },
      { min: 0.15, max: 0.20 },
      { min: 0.21, max: 0.26 },
      { min: 0.27, max: 0.33 },
      { min: 0.34, max: 0.41 },
      { min: 0.42, max: 0.50 },
      { min: 0.51, max: 0.60 },
    ],
  },
  {
    id: 'critDamage',
    slotType: 'prefix',
    displayName: '% Increased Critical Damage',
    tiers: [
      { min: 0.03, max: 0.06 },
      { min: 0.07, max: 0.12 },
      { min: 0.13, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.35 },
      { min: 0.36, max: 0.45 },
      { min: 0.46, max: 0.57 },
      { min: 0.58, max: 0.70 },
      { min: 0.71, max: 0.85 },
      { min: 0.86, max: 1.00 },
    ],
  },
];

// --- Suffix Pool (Defensive/Stat/Utility — 12 affixes) ---

export const SUFFIX_POOL: AffixDef[] = [
  {
    id: 'str',
    slotType: 'suffix',
    displayName: '% Increased STR',
    tiers: [
      { min: 0.02, max: 0.04 },
      { min: 0.05, max: 0.08 },
      { min: 0.09, max: 0.13 },
      { min: 0.14, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.32 },
      { min: 0.33, max: 0.40 },
      { min: 0.41, max: 0.50 },
      { min: 0.51, max: 0.62 },
      { min: 0.63, max: 0.75 },
    ],
  },
  {
    id: 'dex',
    slotType: 'suffix',
    displayName: '% Increased DEX',
    tiers: [
      { min: 0.02, max: 0.04 },
      { min: 0.05, max: 0.08 },
      { min: 0.09, max: 0.13 },
      { min: 0.14, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.32 },
      { min: 0.33, max: 0.40 },
      { min: 0.41, max: 0.50 },
      { min: 0.51, max: 0.62 },
      { min: 0.63, max: 0.75 },
    ],
  },
  {
    id: 'int',
    slotType: 'suffix',
    displayName: '% Increased INT',
    tiers: [
      { min: 0.02, max: 0.04 },
      { min: 0.05, max: 0.08 },
      { min: 0.09, max: 0.13 },
      { min: 0.14, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.32 },
      { min: 0.33, max: 0.40 },
      { min: 0.41, max: 0.50 },
      { min: 0.51, max: 0.62 },
      { min: 0.63, max: 0.75 },
    ],
  },
  {
    id: 'vit',
    slotType: 'suffix',
    displayName: '% Increased VIT',
    tiers: [
      { min: 0.02, max: 0.04 },
      { min: 0.05, max: 0.08 },
      { min: 0.09, max: 0.13 },
      { min: 0.14, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.32 },
      { min: 0.33, max: 0.40 },
      { min: 0.41, max: 0.50 },
      { min: 0.51, max: 0.62 },
      { min: 0.63, max: 0.75 },
    ],
  },
  {
    id: 'luk',
    slotType: 'suffix',
    displayName: '% Increased LUK',
    tiers: [
      { min: 0.02, max: 0.04 },
      { min: 0.05, max: 0.08 },
      { min: 0.09, max: 0.13 },
      { min: 0.14, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.32 },
      { min: 0.33, max: 0.40 },
      { min: 0.41, max: 0.50 },
      { min: 0.51, max: 0.62 },
      { min: 0.63, max: 0.75 },
    ],
  },
  {
    id: 'maxLife',
    slotType: 'suffix',
    displayName: '% Increased Max Life',
    tiers: [
      { min: 0.03, max: 0.05 },
      { min: 0.06, max: 0.10 },
      { min: 0.11, max: 0.16 },
      { min: 0.17, max: 0.22 },
      { min: 0.23, max: 0.30 },
      { min: 0.31, max: 0.38 },
      { min: 0.39, max: 0.47 },
      { min: 0.48, max: 0.57 },
      { min: 0.58, max: 0.68 },
      { min: 0.69, max: 0.80 },
    ],
  },
  {
    id: 'defense',
    slotType: 'suffix',
    displayName: '% Increased Defense',
    tiers: [
      { min: 0.03, max: 0.05 },
      { min: 0.06, max: 0.10 },
      { min: 0.11, max: 0.16 },
      { min: 0.17, max: 0.22 },
      { min: 0.23, max: 0.30 },
      { min: 0.31, max: 0.38 },
      { min: 0.39, max: 0.47 },
      { min: 0.48, max: 0.57 },
      { min: 0.58, max: 0.68 },
      { min: 0.69, max: 0.80 },
    ],
  },
  {
    id: 'dodgeChance',
    slotType: 'suffix',
    displayName: '% Increased Dodge Chance',
    tiers: [
      { min: 0.01, max: 0.03 },
      { min: 0.04, max: 0.06 },
      { min: 0.07, max: 0.10 },
      { min: 0.11, max: 0.14 },
      { min: 0.15, max: 0.20 },
      { min: 0.21, max: 0.26 },
      { min: 0.27, max: 0.33 },
      { min: 0.34, max: 0.41 },
      { min: 0.42, max: 0.50 },
      { min: 0.51, max: 0.60 },
    ],
  },
  {
    id: 'goldFind',
    slotType: 'suffix',
    displayName: '% Increased Gold Find',
    tiers: [
      { min: 0.03, max: 0.06 },
      { min: 0.07, max: 0.12 },
      { min: 0.13, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.35 },
      { min: 0.36, max: 0.45 },
      { min: 0.46, max: 0.57 },
      { min: 0.58, max: 0.70 },
      { min: 0.71, max: 0.85 },
      { min: 0.86, max: 1.00 },
    ],
  },
  {
    id: 'xpGain',
    slotType: 'suffix',
    displayName: '% Increased XP Gain',
    tiers: [
      { min: 0.02, max: 0.05 },
      { min: 0.06, max: 0.10 },
      { min: 0.11, max: 0.15 },
      { min: 0.16, max: 0.22 },
      { min: 0.23, max: 0.30 },
      { min: 0.31, max: 0.38 },
      { min: 0.39, max: 0.47 },
      { min: 0.48, max: 0.57 },
      { min: 0.58, max: 0.68 },
      { min: 0.69, max: 0.80 },
    ],
  },
  {
    id: 'hpRegen',
    slotType: 'suffix',
    displayName: '% Increased HP Regen',
    tiers: [
      { min: 0.03, max: 0.06 },
      { min: 0.07, max: 0.12 },
      { min: 0.13, max: 0.18 },
      { min: 0.19, max: 0.25 },
      { min: 0.26, max: 0.35 },
      { min: 0.36, max: 0.45 },
      { min: 0.46, max: 0.57 },
      { min: 0.58, max: 0.70 },
      { min: 0.71, max: 0.85 },
      { min: 0.86, max: 1.00 },
    ],
  },
  {
    id: 'lootRarity',
    slotType: 'suffix',
    displayName: '% Increased Loot Rarity',
    tiers: [
      { min: 0.01, max: 0.03 },
      { min: 0.04, max: 0.06 },
      { min: 0.07, max: 0.10 },
      { min: 0.11, max: 0.14 },
      { min: 0.15, max: 0.20 },
      { min: 0.21, max: 0.26 },
      { min: 0.27, max: 0.33 },
      { min: 0.34, max: 0.41 },
      { min: 0.42, max: 0.50 },
      { min: 0.51, max: 0.60 },
    ],
  },
];

// --- Affix Count Distribution ---
// Weights for how many affixes roll on an item (1-6), min 1 guaranteed.
// LUK shifts the distribution toward more affixes.

const AFFIX_COUNT_WEIGHTS = [40, 30, 20, 7, 2.5, 0.5]; // index 0 = 1 affix, index 5 = 6 affixes

export function rollAffixCount(luk: number): number {
  // LUK shifts weights: boost higher affix counts slightly
  const lukShift = 1 + 0.5 * (1 - 1 / (1 + luk / 80));
  const weights = AFFIX_COUNT_WEIGHTS.map((w, i) => i === 0 ? w : w * lukShift);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i + 1;
  }
  return 1;
}

// --- Roll a Single Affix Value ---

export function rollAffixValue(def: AffixDef, tier: number, rarity: Rarity): number {
  const t = def.tiers[tier - 1];
  const raw = t.min + Math.random() * (t.max - t.min);
  const multiplied = raw * RARITY_AFFIX_MULTIPLIER[rarity];
  return parseFloat(multiplied.toFixed(4));
}

// --- Roll Tier (weighted toward lower, higher ilvl = better odds) ---

export function rollTier(maxTier: number): number {
  // Weight: T1 most common, higher tiers progressively rarer
  const weights: number[] = [];
  for (let t = 1; t <= maxTier; t++) {
    weights.push(1 / t); // T1=1, T2=0.5, T3=0.33, T4=0.25, T5=0.2
  }
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i + 1;
  }
  return 1;
}

// --- Roll Complete Affixes for an Item ---

export function rollAffixes(
  itemLevel: number,
  rarity: Rarity,
  luk: number,
): { prefixes: (Affix | null)[]; suffixes: (Affix | null)[] } {
  const maxTier = getMaxTier(itemLevel);
  const count = rollAffixCount(luk);

  const prefixes: (Affix | null)[] = [null, null, null];
  const suffixes: (Affix | null)[] = [null, null, null];

  const usedPrefixIds = new Set<AffixId>();
  const usedSuffixIds = new Set<AffixId>();
  let prefixCount = 0;
  let suffixCount = 0;

  for (let i = 0; i < count; i++) {
    // Determine which pools are still available
    const canPrefix = prefixCount < 3;
    const canSuffix = suffixCount < 3;
    if (!canPrefix && !canSuffix) break;

    let pool: AffixDef[];
    let isPrefix: boolean;

    if (!canPrefix) {
      isPrefix = false;
    } else if (!canSuffix) {
      isPrefix = true;
    } else {
      // Weighted random: prefixes 4/16, suffixes 12/16 (proportional to pool size)
      isPrefix = Math.random() < PREFIX_POOL.length / (PREFIX_POOL.length + SUFFIX_POOL.length);
    }

    if (isPrefix) {
      const available = PREFIX_POOL.filter(d => !usedPrefixIds.has(d.id));
      if (available.length === 0) { // fallback to suffix
        const availSuffix = SUFFIX_POOL.filter(d => !usedSuffixIds.has(d.id));
        if (availSuffix.length === 0) break;
        const def = availSuffix[Math.floor(Math.random() * availSuffix.length)];
        const tier = rollTier(maxTier);
        const value = rollAffixValue(def, tier, rarity);
        suffixes[suffixCount] = { id: def.id, slotType: 'suffix', tier, value };
        usedSuffixIds.add(def.id);
        suffixCount++;
        continue;
      }
      const def = available[Math.floor(Math.random() * available.length)];
      const tier = rollTier(maxTier);
      const value = rollAffixValue(def, tier, rarity);
      prefixes[prefixCount] = { id: def.id, slotType: 'prefix', tier, value };
      usedPrefixIds.add(def.id);
      prefixCount++;
    } else {
      pool = SUFFIX_POOL.filter(d => !usedSuffixIds.has(d.id));
      if (pool.length === 0) { // fallback to prefix
        const availPrefix = PREFIX_POOL.filter(d => !usedPrefixIds.has(d.id));
        if (availPrefix.length === 0) break;
        const def = availPrefix[Math.floor(Math.random() * availPrefix.length)];
        const tier = rollTier(maxTier);
        const value = rollAffixValue(def, tier, rarity);
        prefixes[prefixCount] = { id: def.id, slotType: 'prefix', tier, value };
        usedPrefixIds.add(def.id);
        prefixCount++;
        continue;
      }
      const def = pool[Math.floor(Math.random() * pool.length)];
      const tier = rollTier(maxTier);
      const value = rollAffixValue(def, tier, rarity);
      suffixes[suffixCount] = { id: def.id, slotType: 'suffix', tier, value };
      usedSuffixIds.add(def.id);
      suffixCount++;
    }
  }

  return { prefixes, suffixes };
}

// --- Lookup affix display name ---

const ALL_AFFIXES = [...PREFIX_POOL, ...SUFFIX_POOL];

export function getAffixDisplayName(id: AffixId): string {
  return ALL_AFFIXES.find(a => a.id === id)?.displayName ?? id;
}

export function getAffixShortName(id: AffixId): string {
  return getAffixDisplayName(id).replace('% Increased ', '');
}

export function formatAffix(affix: { id: AffixId; tier: number; value: number }): string {
  return `[T${affix.tier}] +${(affix.value * 100).toFixed(1)}% ${getAffixShortName(affix.id)}`;
}
