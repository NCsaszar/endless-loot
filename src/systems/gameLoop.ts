import type { GameState, DerivedStats } from '../types';
import { spawnMob, playerAttack, mobAttack, handlePlayerDeath, regenHp } from './combat';
import { grantXpAndGold, handleBossKill } from './progression';
import { shouldDropLoot, generateItem, generateBossLoot } from './loot';
import { addLog } from './combat';

export function tick(state: GameState, derived: DerivedStats, dt: number): void {
  // Clean up expired damage popups (800ms lifetime)
  const now = Date.now();
  state.combat.damagePopups = state.combat.damagePopups.filter(p => now - p.timestamp < 800);

  if (state.combat.isPlayerDead) {
    handlePlayerDeath(state, derived);
    return;
  }

  // Spawn mob if none exists
  if (!state.combat.currentMob) {
    spawnMob(state);
    return;
  }

  const mob = state.combat.currentMob;

  // HP regen
  regenHp(state, derived, dt);

  // Player attack timer
  state.combat.playerAttackProgress += derived.attackSpeed * dt;
  if (state.combat.playerAttackProgress >= 1) {
    state.combat.playerAttackProgress = 0;
    const { killed } = playerAttack(state, derived);

    if (killed) {
      // Grant rewards
      grantXpAndGold(state, mob);
      handleBossKill(state, mob);

      // Loot roll
      const isBoss = mob.def.isBoss;
      if (shouldDropLoot(isBoss)) {
        const itemLevel = mob.level;
        const item = isBoss ? generateBossLoot(itemLevel) : generateItem(itemLevel);
        if (state.autoSellRarities.includes(item.rarity)) {
          state.gold += item.sellValue;
          state.totalGoldEarned += item.sellValue;
          addLog(state, `Auto-sold ${item.name} for ${item.sellValue}g`, 'loot');
        } else {
          state.inventory.push(item);
          addLog(state, `Loot: ${item.name} (${item.rarity})`, 'loot');
        }
      }

      // Spawn next mob
      spawnMob(state);
      return;
    }
  }

  // Mob attack timer
  state.combat.mobAttackProgress += mob.attackSpeed * dt;
  if (state.combat.mobAttackProgress >= 1) {
    state.combat.mobAttackProgress = 0;
    mobAttack(state, derived);
  }
}
