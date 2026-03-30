import type { GameState } from '../types';
import { xpForLevel } from '../data/formulas';

const SAVE_KEY = 'endless_loot_save';
const SAVE_VERSION = 1;

export function createDefaultState(): GameState {
  return {
    character: {
      name: 'Hero',
      level: 1,
      xp: 0,
      xpToNextLevel: xpForLevel(1),
      unspentStatPoints: 0,
      baseStats: { str: 5, dex: 5, int: 5, vit: 5 },
      trainingStats: { str: 0, dex: 0, int: 0, vit: 0 },
      currentHp: 90, // BASE_HP(50) + 5 VIT * 8 = 90
    },
    trainingLevels: { str: 0, dex: 0, int: 0, vit: 0 },
    equipment: {},
    inventory: [],
    gold: 0,
    materials: { scrap: 0, fragments: 0, crystals: 0, essences: 0, legendaryShards: 0 },
    currentZoneId: 1,
    unlockedZoneIds: [1],
    bossesDefeated: [],
    combat: {
      currentMob: null,
      playerAttackProgress: 0,
      mobAttackProgress: 0,
      killCount: 0,
      isPlayerDead: false,
    },
    combatLog: [],
    totalKills: 0,
    totalGoldEarned: 0,
    lastSaveTimestamp: Date.now(),
    saveVersion: SAVE_VERSION,
  };
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
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.saveVersion !== SAVE_VERSION) return null;
    // Restore transient combat state
    parsed.combat.currentMob = null;
    parsed.combat.playerAttackProgress = 0;
    parsed.combat.mobAttackProgress = 0;
    parsed.combatLog = [];
    return parsed;
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
