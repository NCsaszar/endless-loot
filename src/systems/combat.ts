import type { GameState, MobInstance, MobDef, CombatLogEntry, DerivedStats } from '../types';
import { scaleMobStat, mobXpReward, mobGoldReward } from '../data/formulas';
import { getZone } from '../data/zones';

let logId = 0;

function addLog(state: GameState, message: string, type: CombatLogEntry['type']): void {
  state.combatLog.unshift({ id: ++logId, timestamp: Date.now(), message, type });
  if (state.combatLog.length > 50) state.combatLog.length = 50;
}

export function spawnMob(state: GameState): void {
  const zone = getZone(state.currentZoneId);
  if (!zone) return;

  const [minLv, maxLv] = zone.levelRange;
  const level = minLv + Math.floor(Math.random() * (maxLv - minLv + 1));

  // 10% chance to spawn boss if boss not yet defeated in this zone, otherwise always regular
  let mobDef: MobDef;
  const bossAvailable = !state.bossesDefeated.includes(zone.id);
  if (bossAvailable && state.combat.killCount > 0 && state.combat.killCount % 10 === 0) {
    mobDef = zone.boss;
  } else {
    mobDef = zone.mobs[Math.floor(Math.random() * zone.mobs.length)];
  }

  const mob: MobInstance = {
    def: mobDef,
    level,
    maxHp: scaleMobStat(mobDef.baseHp, level),
    currentHp: scaleMobStat(mobDef.baseHp, level),
    atk: scaleMobStat(mobDef.baseAtk, level),
    defense: scaleMobStat(mobDef.baseDef, level),
    xpReward: mobXpReward(mobDef.baseXp, level, zone.id, mobDef.isBoss),
    goldReward: mobGoldReward(mobDef.baseGold, level, zone.id, mobDef.isBoss),
    attackSpeed: mobDef.isBoss ? 0.6 : 0.8,
  };

  state.combat.currentMob = mob;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.isPlayerDead = false;

  if (mobDef.isBoss) {
    addLog(state, `Boss appeared: ${mobDef.name} (Lv.${level})!`, 'info');
  }
}

export function playerAttack(state: GameState, derived: DerivedStats): { killed: boolean } {
  const mob = state.combat.currentMob;
  if (!mob) return { killed: false };

  const rawDmg = derived.attackPower * (0.9 + Math.random() * 0.2);
  const isCrit = Math.random() < derived.critChance;
  const finalDmg = rawDmg * (isCrit ? derived.critDamage : 1);
  const dmgDealt = Math.max(1, Math.floor(finalDmg - mob.defense));

  mob.currentHp -= dmgDealt;

  const critText = isCrit ? ' (CRIT!)' : '';
  addLog(state, `You deal ${dmgDealt} damage to ${mob.def.name}${critText}`, 'damage');

  if (mob.currentHp <= 0) {
    mob.currentHp = 0;
    state.combat.killCount++;
    state.totalKills++;
    addLog(state, `${mob.def.name} defeated!`, 'kill');
    return { killed: true };
  }
  return { killed: false };
}

export function mobAttack(state: GameState, derived: DerivedStats): { playerDied: boolean } {
  const mob = state.combat.currentMob;
  if (!mob) return { playerDied: false };

  // Dodge check
  if (Math.random() < derived.dodgeChance) {
    addLog(state, `You dodged ${mob.def.name}'s attack!`, 'info');
    return { playerDied: false };
  }

  const rawDmg = mob.atk * (0.9 + Math.random() * 0.2);
  const dmgTaken = Math.max(1, Math.floor(rawDmg - derived.defense));

  state.character.currentHp -= dmgTaken;

  addLog(state, `${mob.def.name} deals ${dmgTaken} damage to you`, 'playerDamage');

  if (state.character.currentHp <= 0) {
    state.character.currentHp = 0;
    state.combat.isPlayerDead = true;
    addLog(state, 'You have been defeated! Retreating...', 'death');
    return { playerDied: true };
  }
  return { playerDied: false };
}

export function handlePlayerDeath(state: GameState, derived: DerivedStats): void {
  // Retreat to previous zone or stay in zone 1
  if (state.currentZoneId > 1) {
    state.currentZoneId--;
    addLog(state, `Retreated to zone ${state.currentZoneId}`, 'info');
  }

  state.character.currentHp = derived.maxHp;
  state.combat.isPlayerDead = false;
  state.combat.killCount = 0;
  state.combat.currentMob = null;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
}

export function regenHp(state: GameState, derived: DerivedStats, dt: number): void {
  if (state.character.currentHp < derived.maxHp) {
    state.character.currentHp = Math.min(
      derived.maxHp,
      state.character.currentHp + derived.hpRegen * dt
    );
  }
}

export { addLog };
