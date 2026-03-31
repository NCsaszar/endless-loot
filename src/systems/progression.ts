import type { GameState, MobInstance, PrimaryStat } from '../types';
import { xpForLevel } from '../data/formulas';
import { addLog } from './combat';

export function grantXpAndGold(state: GameState, mob: MobInstance, xpMultiplier: number = 1): void {
  const xp = Math.floor(mob.xpReward * xpMultiplier);
  state.character.xp += xp;
  state.gold += mob.goldReward;
  state.totalGoldEarned += mob.goldReward;

  // Check for level ups
  while (state.character.xp >= state.character.xpToNextLevel) {
    state.character.xp -= state.character.xpToNextLevel;
    state.character.level++;
    state.character.unspentStatPoints += 3;
    state.character.xpToNextLevel = xpForLevel(state.character.level);
    addLog(state, `Level up! You are now level ${state.character.level}. +3 stat points!`, 'levelUp');
  }
}

export function allocateStat(state: GameState, stat: 'str' | 'dex' | 'int' | 'vit' | 'luk'): boolean {
  if (state.character.unspentStatPoints <= 0) return false;
  state.character.baseStats[stat]++;
  state.character.unspentStatPoints--;
  return true;
}

export function allocateStatMultiple(state: GameState, stat: PrimaryStat, amount: number): number {
  const actual = Math.min(amount, state.character.unspentStatPoints);
  if (actual <= 0) return 0;
  state.character.baseStats[stat] += actual;
  state.character.unspentStatPoints -= actual;
  return actual;
}

const BASE_STAT_VALUE = 5;

export function resetAllStats(state: GameState): boolean {
  const idx = state.inventory.findIndex(i => i.consumable === 'stat_reset');
  if (idx === -1) return false;

  const stats: PrimaryStat[] = ['str', 'dex', 'int', 'vit', 'luk'];
  let totalAllocated = 0;
  for (const s of stats) {
    totalAllocated += state.character.baseStats[s] - BASE_STAT_VALUE;
    state.character.baseStats[s] = BASE_STAT_VALUE;
  }
  state.character.unspentStatPoints += totalAllocated;

  // Consume the item
  state.inventory.splice(idx, 1);
  return true;
}

export function handleBossKill(state: GameState, mob: MobInstance): void {
  // No zone progression during endless runs
  if (state.endless.active) return;

  if (mob.def.isBoss && !state.bossesDefeated.includes(state.currentZoneId)) {
    state.bossesDefeated.push(state.currentZoneId);
    const nextZone = state.currentZoneId + 1;
    if (nextZone <= 50 && !state.unlockedZoneIds.includes(nextZone)) {
      state.unlockedZoneIds.push(nextZone);
      addLog(state, `Zone ${nextZone} unlocked!`, 'info');
    }
    // Unlock endless mode after beating zone 50 boss
    if (state.currentZoneId === 50 && !state.endless.unlocked) {
      state.endless.unlocked = true;
      addLog(state, 'The Abyss has opened! Endless mode is now available.', 'info');
    }
  }
}

export function changeZone(state: GameState, zoneId: number): boolean {
  if (!state.unlockedZoneIds.includes(zoneId)) return false;
  stopCombat(state);
  state.currentZoneId = zoneId;
  state.combat.killCount = 0;
  return true;
}

export function startCombat(state: GameState): void {
  state.combatActive = true;
  state.combat.currentMob = null;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
}

export function stopCombat(state: GameState): void {
  state.combatActive = false;
  state.combat.currentMob = null;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.playerDamageLog = [];
  state.combat.mobDamageLog = [];
}

// --- Endless Mode ---

export function startEndlessRun(state: GameState): void {
  if (!state.endless.unlocked) return;
  state.endless.active = true;
  state.endless.currentFloor = 1;
  state.endless.runKills = 0;
  state.endless.runGoldEarned = 0;
  state.endless.runItemsFound = 0;
  state.combat.killCount = 0;
  state.combat.currentMob = null;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.playerDamageLog = [];
  state.combat.mobDamageLog = [];
  state.combatActive = true;
  addLog(state, 'Descending into The Abyss... Floor 1', 'info');
}

export function endEndlessRun(state: GameState): void {
  if (!state.endless.active) return;
  if (state.endless.currentFloor > state.endless.highestFloor) {
    state.endless.highestFloor = state.endless.currentFloor;
  }
  addLog(state, `Escaped The Abyss at Floor ${state.endless.currentFloor}.`, 'info');
  state.endless.active = false;
  state.combatActive = false;
  state.combat.currentMob = null;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.playerDamageLog = [];
  state.combat.mobDamageLog = [];
}
