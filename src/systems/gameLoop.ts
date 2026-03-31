import type { GameState, DerivedStats, PrimaryStats } from '../types';
import { spawnMob, playerAttack, mobAttack, handlePlayerDeath, regenHp } from './combat';
import { grantXpAndGold, handleBossKill } from './progression';
import { shouldDropLoot, generateItem, generateBossLoot, rollConsumableDrop } from './loot';
import { addLog } from './combat';
import { lukGoldMultiplier } from '../data/formulas';
import { getZone } from '../data/zones';

export function tick(state: GameState, derived: DerivedStats, dt: number, primaryStats?: PrimaryStats): void {
  const luk = primaryStats?.luk ?? 0;

  // Clamp HP to current max (prevents bar showing full after maxHp decreases)
  state.character.currentHp = Math.min(state.character.currentHp, derived.maxHp);

  // Clean up expired damage popups (800ms lifetime) and DPS logs (10s window)
  const now = Date.now();
  state.combat.damagePopups = state.combat.damagePopups.filter(p => now - p.timestamp < 800);
  state.combat.playerDamageLog = state.combat.playerDamageLog.filter(e => now - e.timestamp < 10_000);
  state.combat.mobDamageLog = state.combat.mobDamageLog.filter(e => now - e.timestamp < 10_000);

  if (!state.combatActive) return;

  if (state.combat.isPlayerDead) {
    // Normal mode: wait for death modal dismissal
    if (state.combat.deathInfo && !state.endless.active) {
      return;
    }
    // Endless mode or legacy: handle immediately
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
      // Apply gold multipliers: LUK base + gear goldFind
      const goldMult = lukGoldMultiplier(luk) * derived.goldFind;
      mob.goldReward = Math.floor(mob.goldReward * goldMult);

      // Grant XP with gear xpGainBonus
      grantXpAndGold(state, mob, derived.xpGainBonus);
      handleBossKill(state, mob);

      // Endless mode: track run stats and advance floors
      if (state.endless.active) {
        state.endless.runKills++;
        state.endless.runGoldEarned += mob.goldReward;
        // Advance floor every 3 kills
        if (state.endless.runKills % 3 === 0) {
          state.endless.currentFloor++;
          addLog(state, `Descended to Floor ${state.endless.currentFloor}`, 'info');
        }
      }

      // Loot roll
      const isBoss = mob.def.isBoss;
      if (shouldDropLoot(isBoss, luk)) {
        const itemLevel = mob.level;
        // Endless mode: rarity bonus scales with floor
        const rarityBonus = state.endless.active
          ? (0.01 * state.endless.currentFloor + derived.lootRarityBonus)
          : ((getZone(state.currentZoneId)?.rarityBonus ?? 0) + derived.lootRarityBonus);
        // Act-end bosses (zones 10, 20, 30, 40, 50) get guaranteed minimum rarity
        let bossMinRarity: import('../types').Rarity | undefined;
        if (isBoss && !state.endless.active) {
          const zone = getZone(state.currentZoneId);
          if (zone && zone.id % 10 === 0) {
            bossMinRarity = zone.act >= 2 ? 'epic' : 'rare';
            if (zone.act >= 5) bossMinRarity = 'legendary';
          }
        }
        const item = isBoss ? generateBossLoot(itemLevel, luk, rarityBonus, bossMinRarity) : generateItem(itemLevel, undefined, luk, rarityBonus);
        if (!item.consumable && state.autoSalvageRarities.includes(item.rarity)) {
          state.materials[item.salvageResult.material] += item.salvageResult.amount;
          addLog(state, `Auto-salvaged ${item.name} → ${item.salvageResult.amount} ${item.salvageResult.material}`, 'loot');
        } else if (!item.consumable && state.autoSellRarities.includes(item.rarity)) {
          const sellGold = Math.floor(item.sellValue * goldMult);
          state.gold += sellGold;
          state.totalGoldEarned += sellGold;
          addLog(state, `Auto-sold ${item.name} for ${sellGold}g`, 'loot');
        } else {
          state.inventory.push(item);
          if (state.endless.active) state.endless.runItemsFound++;
          addLog(state, `Loot: ${item.name} (${item.rarity})`, 'loot');
        }
      }

      // Roll for ultra-rare consumable drop
      const consumable = rollConsumableDrop(luk);
      if (consumable) {
        state.inventory.push(consumable);
        addLog(state, `Ultra-rare drop: ${consumable.name}!`, 'loot');
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
