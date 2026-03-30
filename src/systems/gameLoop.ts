import type { GameState, DerivedStats, PrimaryStats } from '../types';
import { spawnMob, playerAttack, mobAttack, handlePlayerDeath, regenHp } from './combat';
import { grantXpAndGold, handleBossKill } from './progression';
import { shouldDropLoot, generateItem, generateBossLoot } from './loot';
import { addLog } from './combat';
import { lukGoldMultiplier } from '../data/formulas';

export function tick(state: GameState, derived: DerivedStats, dt: number, primaryStats?: PrimaryStats): void {
  const luk = primaryStats?.luk ?? 0;
  // Clean up expired damage popups (800ms lifetime) and DPS logs (10s window)
  const now = Date.now();
  state.combat.damagePopups = state.combat.damagePopups.filter(p => now - p.timestamp < 800);
  state.combat.playerDamageLog = state.combat.playerDamageLog.filter(e => now - e.timestamp < 10_000);
  state.combat.mobDamageLog = state.combat.mobDamageLog.filter(e => now - e.timestamp < 10_000);

  if (!state.combatActive) return;

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
      // Grant rewards (apply LUK gold multiplier)
      const goldMult = lukGoldMultiplier(luk);
      mob.goldReward = Math.floor(mob.goldReward * goldMult);
      grantXpAndGold(state, mob);
      handleBossKill(state, mob);

      // Loot roll
      const isBoss = mob.def.isBoss;
      if (shouldDropLoot(isBoss, luk)) {
        const itemLevel = mob.level;
        const item = isBoss ? generateBossLoot(itemLevel, luk) : generateItem(itemLevel, undefined, luk);
        if (state.autoSalvageRarities.includes(item.rarity)) {
          state.materials[item.salvageResult.material] += item.salvageResult.amount;
          addLog(state, `Auto-salvaged ${item.name} → ${item.salvageResult.amount} ${item.salvageResult.material}`, 'loot');
        } else if (state.autoSellRarities.includes(item.rarity)) {
          const sellGold = Math.floor(item.sellValue * goldMult);
          state.gold += sellGold;
          state.totalGoldEarned += sellGold;
          addLog(state, `Auto-sold ${item.name} for ${sellGold}g`, 'loot');
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
