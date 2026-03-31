import type { GameState, Item, PrimaryStat, Affix } from '../types';
import { xpForLevel } from '../data/formulas';
import { getMaxTier } from '../data/affixes';

const SAVE_KEY = 'endless_loot_save';
const SAVE_VERSION = 6;

export function createDefaultState(): GameState {
  return {
    character: {
      name: 'Hero',
      level: 1,
      xp: 0,
      xpToNextLevel: xpForLevel(1),
      unspentStatPoints: 0,
      baseStats: { str: 5, dex: 5, int: 5, vit: 5, luk: 5 },
      trainingStats: { str: 0, dex: 0, int: 0, vit: 0, luk: 0 },
      currentHp: 90, // BASE_HP(50) + 5 VIT * 8 = 90
    },
    trainingLevels: { str: 0, dex: 0, int: 0, vit: 0, luk: 0 },
    equipment: {},
    inventory: [],
    gold: 0,
    materials: { scrap: 0, fragments: 0, crystals: 0, essences: 0, legendaryShards: 0 },
    essences: [],
    currentZoneId: 1,
    unlockedZoneIds: [1],
    bossesDefeated: [],
    combat: {
      currentMob: null,
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      killCount: 0,
      isPlayerDead: false,
      damagePopups: [],
      playerDamageLog: [],
      mobDamageLog: [],
    },
    combatLog: [],
    totalKills: 0,
    totalGoldEarned: 0,
    lastSaveTimestamp: Date.now(),
    saveVersion: SAVE_VERSION,
    autoSellRarities: [],
    autoSalvageRarities: [],
    combatActive: false,
    endless: {
      unlocked: false,
      active: false,
      currentFloor: 0,
      highestFloor: 0,
      runKills: 0,
      runGoldEarned: 0,
      runItemsFound: 0,
    },
  };
}

// --- V1 → V2 Migration: Convert old bonusStat items to affix system ---

const PRIMARY_STAT_KEYS: PrimaryStat[] = ['str', 'dex', 'int', 'vit', 'luk'];

function migrateItemV1toV2(oldItem: any): Item {
  // Strip old affix names from item name
  const prefixPattern = /^(Fine|Keen|Sturdy|Superior|Masterwork|Exquisite|Mythic|Arcane|Transcendent|Godforged|Eternal|Primordial) /;
  const affixPattern = / of (Might|Agility|Wisdom|Vitality|Fortune|Precision|Evasion|Endurance|Fortitude)$/;
  const cleanName = (oldItem.name || '').replace(prefixPattern, '').replace(affixPattern, '');

  const oldBonusStats: any[] = oldItem.bonusStats || [];

  // Pick random primary stat — prefer one from existing bonus stats if available
  let randomPrimaryStat: PrimaryStat = PRIMARY_STAT_KEYS[Math.floor(Math.random() * PRIMARY_STAT_KEYS.length)];
  let randomPrimaryStatValue = Math.max(1, Math.floor(1 + (oldItem.itemLevel || 1) * 0.3));

  const primaryBonus = oldBonusStats.find((b: any) => PRIMARY_STAT_KEYS.includes(b.type));
  if (primaryBonus) {
    randomPrimaryStat = primaryBonus.type;
    randomPrimaryStatValue = primaryBonus.value || randomPrimaryStatValue;
  }

  // Convert remaining bonus stats to affixes
  const prefixes: (Affix | null)[] = [null, null, null];
  const suffixes: (Affix | null)[] = [null, null, null];
  let prefixIdx = 0;
  let suffixIdx = 0;

  const maxTier = getMaxTier(oldItem.itemLevel || 1);
  const tier = Math.min(maxTier, Math.max(1, Math.ceil((oldItem.itemLevel || 1) / 3)));

  for (const bonus of oldBonusStats) {
    // Skip the one we used as randomPrimaryStat
    if (primaryBonus && bonus === primaryBonus) continue;

    if (bonus.type === 'critChance' && prefixIdx < 3) {
      prefixes[prefixIdx++] = { id: 'critChance', slotType: 'prefix', tier, value: bonus.value || 0.03 };
    } else if (bonus.type === 'dodgeChance' && suffixIdx < 3) {
      suffixes[suffixIdx++] = { id: 'dodgeChance', slotType: 'suffix', tier, value: bonus.value || 0.03 };
    } else if (bonus.type === 'hp' && suffixIdx < 3) {
      // Convert flat HP to approximate %: flatHP / baseline
      const baselineHp = 50 + 5 * 8; // BASE_HP + ~5 VIT * VIT_TO_HP
      const pct = Math.min(0.30, Math.max(0.03, bonus.value / baselineHp));
      suffixes[suffixIdx++] = { id: 'maxLife', slotType: 'suffix', tier, value: parseFloat(pct.toFixed(4)) };
    } else if (bonus.type === 'defense' && suffixIdx < 3) {
      const baselineDef = 2 + 5 * 1.2; // BASE_DEF + ~5 VIT * VIT_TO_DEF
      const pct = Math.min(0.30, Math.max(0.03, bonus.value / baselineDef));
      suffixes[suffixIdx++] = { id: 'defense', slotType: 'suffix', tier, value: parseFloat(pct.toFixed(4)) };
    } else if (PRIMARY_STAT_KEYS.includes(bonus.type) && suffixIdx < 3) {
      // Convert flat primary stat bonus to %
      const baselineStat = 5 + (oldItem.itemLevel || 1); // rough estimate
      const pct = Math.min(0.25, Math.max(0.02, bonus.value / baselineStat));
      suffixes[suffixIdx++] = { id: bonus.type, slotType: 'suffix', tier, value: parseFloat(pct.toFixed(4)) };
    }
  }

  return {
    id: oldItem.id,
    name: cleanName,
    slot: oldItem.slot,
    rarity: oldItem.rarity,
    itemLevel: oldItem.itemLevel,
    primaryStatValue: oldItem.primaryStatValue,
    randomPrimaryStat,
    randomPrimaryStatValue,
    prefixes,
    suffixes,
    sellValue: oldItem.sellValue,
    salvageResult: oldItem.salvageResult,
    locked: oldItem.locked ?? false,
  };
}

function migrateV1toV2(parsed: any): any {
  // Migrate inventory items
  if (Array.isArray(parsed.inventory)) {
    parsed.inventory = parsed.inventory.map(migrateItemV1toV2);
  }

  // Migrate equipped items
  if (parsed.equipment) {
    for (const slot of Object.keys(parsed.equipment)) {
      if (parsed.equipment[slot]) {
        parsed.equipment[slot] = migrateItemV1toV2(parsed.equipment[slot]);
      }
    }
  }

  parsed.saveVersion = 2;
  return parsed;
}

// --- V2 → V3 Migration: Add essences storage ---

function migrateV2toV3(parsed: any): any {
  if (!Array.isArray(parsed.essences)) {
    parsed.essences = [];
  }
  parsed.saveVersion = 3;
  return parsed;
}

// --- V3 → V4 Migration: Add endless mode state ---

function migrateV3toV4(parsed: any): any {
  if (!parsed.endless) {
    parsed.endless = {
      unlocked: false,
      active: false,
      currentFloor: 0,
      highestFloor: 0,
      runKills: 0,
      runGoldEarned: 0,
      runItemsFound: 0,
    };
  }
  parsed.saveVersion = 4;
  return parsed;
}

// --- V4 → V5 Migration: Remove training system (zero out training stats) ---

function migrateV4toV5(parsed: any): any {
  if (parsed.trainingLevels) {
    for (const key of Object.keys(parsed.trainingLevels)) {
      parsed.trainingLevels[key] = 0;
    }
  }
  if (parsed.character?.trainingStats) {
    for (const key of Object.keys(parsed.character.trainingStats)) {
      parsed.character.trainingStats[key] = 0;
    }
  }
  parsed.saveVersion = 5;
  return parsed;
}

export function saveGame(state: GameState): void {
  state.lastSaveTimestamp = Date.now();
  state.saveVersion = SAVE_VERSION;
  // Strip transient combat state for save
  const toSave = {
    ...state,
    combat: {
      ...state.combat,
      currentMob: null,
      playerAttackProgress: 0,
      mobAttackProgress: 0,
    },
    combatLog: [],
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    let parsed = JSON.parse(raw);

    // Migrate v1 saves to v2
    if (parsed.saveVersion === 1) {
      parsed = migrateV1toV2(parsed);
    }

    // Migrate v2 saves to v3
    if (parsed.saveVersion === 2) {
      parsed = migrateV2toV3(parsed);
    }

    // Migrate v3 saves to v4
    if (parsed.saveVersion === 3) {
      parsed = migrateV3toV4(parsed);
    }

    // Migrate v4 saves to v5: zero out training
    if (parsed.saveVersion === 4) {
      parsed = migrateV4toV5(parsed);
    }

    // Migrate v5 saves to v6: consumable items + unique rarity (no structural changes needed)
    if (parsed.saveVersion === 5) {
      parsed.saveVersion = 6;
    }

    if (parsed.saveVersion !== SAVE_VERSION) return null;

    // Restore transient combat state
    parsed.combat.currentMob = null;
    parsed.combat.playerAttackProgress = 0;
    parsed.combat.mobAttackProgress = 0;
    parsed.combat.damagePopups = [];
    parsed.combat.playerDamageLog = [];
    parsed.combat.mobDamageLog = [];
    parsed.combatLog = [];
    // Migration: add fields that may be missing from older saves
    if (!parsed.autoSellRarities) parsed.autoSellRarities = [];
    if (!parsed.autoSalvageRarities) parsed.autoSalvageRarities = [];
    // Migration: add LUK stat
    if (parsed.character.baseStats.luk === undefined) parsed.character.baseStats.luk = 5;
    if (parsed.character.trainingStats.luk === undefined) parsed.character.trainingStats.luk = 0;
    if (parsed.trainingLevels.luk === undefined) parsed.trainingLevels.luk = 0;
    // Migration: add combatActive (existing saves should default to active)
    if (parsed.combatActive === undefined) parsed.combatActive = true;
    // Migration: add endless state
    if (!parsed.endless) {
      parsed.endless = {
        unlocked: false, active: false, currentFloor: 0,
        highestFloor: 0, runKills: 0, runGoldEarned: 0, runItemsFound: 0,
      };
    }
    // Migration: add locked field to items
    for (const item of parsed.inventory) {
      if (item.locked === undefined) item.locked = false;
    }
    for (const item of Object.values(parsed.equipment)) {
      if (item && (item as any).locked === undefined) (item as any).locked = false;
    }
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function deleteGame(): void {
  localStorage.removeItem(SAVE_KEY);
}

export interface OfflineProgress {
  elapsedSeconds: number;
  kills: number;
  xpGained: number;
  goldGained: number;
  levelsGained: number;
  itemsFound: number;
}

export function calculateOfflineProgress(state: GameState): OfflineProgress | null {
  const elapsed = (Date.now() - state.lastSaveTimestamp) / 1000;
  if (elapsed < 60) return null; // less than 1 minute, skip

  // Estimate average fight duration based on player power vs zone mobs
  const avgFightDuration = 3; // seconds — rough estimate
  const kills = Math.floor(elapsed / avgFightDuration);
  if (kills <= 0) return null;

  // Estimate rewards per kill based on zone
  const avgXpPerKill = 15 * state.character.level;
  const avgGoldPerKill = 8 * state.character.level;

  const xpGained = kills * avgXpPerKill;
  const goldGained = kills * avgGoldPerKill;

  // Apply XP and gold
  state.gold += goldGained;
  state.totalGoldEarned += goldGained;

  let levelsGained = 0;
  let remainingXp = xpGained;
  while (remainingXp > 0) {
    const needed = state.character.xpToNextLevel - state.character.xp;
    if (remainingXp >= needed) {
      remainingXp -= needed;
      state.character.xp = 0;
      state.character.level++;
      state.character.unspentStatPoints += 3;
      state.character.xpToNextLevel = xpForLevel(state.character.level);
      levelsGained++;
    } else {
      state.character.xp += remainingXp;
      remainingXp = 0;
    }
  }

  state.totalKills += kills;

  // Generate some items (capped at 50)
  const itemsFound = Math.min(50, Math.floor(kills * 0.6));

  return {
    elapsedSeconds: elapsed,
    kills,
    xpGained,
    goldGained,
    levelsGained,
    itemsFound,
  };
}
