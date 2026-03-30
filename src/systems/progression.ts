import type { GameState, MobInstance } from '../types';
import { xpForLevel } from '../data/formulas';
import { addLog } from './combat';

export function grantXpAndGold(state: GameState, mob: MobInstance): void {
  state.character.xp += mob.xpReward;
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

export function handleBossKill(state: GameState, mob: MobInstance): void {
  if (mob.def.isBoss && !state.bossesDefeated.includes(state.currentZoneId)) {
    state.bossesDefeated.push(state.currentZoneId);
    const nextZone = state.currentZoneId + 1;
    if (!state.unlockedZoneIds.includes(nextZone)) {
      state.unlockedZoneIds.push(nextZone);
      addLog(state, `Zone ${nextZone} unlocked!`, 'info');
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
