import type { GameState, MobInstance, MobDef, CombatLogEntry, DerivedStats, DamagePopup } from '../types';
import { scaleMobStat, mobXpReward, mobGoldReward } from '../data/formulas';
import { getZone, getAllMobs, ZONES } from '../data/zones';

let logId = 0;
let popupId = 0;

function addPopup(state: GameState, amount: number, target: DamagePopup['target'], type: DamagePopup['type'], isCrit = false): void {
  state.combat.damagePopups.push({ id: ++popupId, amount, isCrit, target, type, timestamp: Date.now() });
}

function addLog(state: GameState, message: string, type: CombatLogEntry['type']): void {
  state.combatLog.unshift({ id: ++logId, timestamp: Date.now(), message, type });
  if (state.combatLog.length > 50) state.combatLog.length = 50;
}

export function spawnMob(state: GameState): void {
  // Endless mode uses its own spawning logic
  if (state.endless.active) {
    spawnEndlessMob(state);
    return;
  }

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
    attackSpeed: mobDef.isBoss ? 0.6 + 0.05 * (zone.act - 1) : 0.8 + 0.05 * (zone.act - 1),
  };

  state.combat.currentMob = mob;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.isPlayerDead = false;

  if (mobDef.isBoss) {
    addLog(state, `Boss appeared: ${mobDef.name} (Lv.${level})!`, 'info');
  }
}

// --- Endless Mode Mob Spawning ---

const endlessMobPool = getAllMobs();

function spawnEndlessMob(state: GameState): void {
  const floor = state.endless.currentFloor;
  // Base level starts at 150 (zone 50 max), scales +1 per floor
  const level = 150 + floor;
  // Floor scaling: +4% HP/ATK per floor
  const floorScale = 1 + 0.04 * floor;

  // Boss every 10 floors
  const isBossFloor = floor > 0 && state.combat.killCount > 0 && state.combat.killCount % 3 === 0
    && floor % 10 === 0;

  let mobDef: MobDef;
  if (isBossFloor) {
    // Pick a random boss from all zones
    const bosses = ZONES.map(z => z.boss);
    mobDef = bosses[Math.floor(Math.random() * bosses.length)];
  } else {
    mobDef = endlessMobPool[Math.floor(Math.random() * endlessMobPool.length)];
  }

  const baseHp = Math.floor(scaleMobStat(mobDef.baseHp, level) * floorScale * (isBossFloor ? 3.5 : 1));
  const baseAtk = Math.floor(scaleMobStat(mobDef.baseAtk, level) * floorScale * (isBossFloor ? 2.0 : 1));
  const baseDef = Math.floor(scaleMobStat(mobDef.baseDef, level) * floorScale * (isBossFloor ? 2.5 : 1));

  const mob: MobInstance = {
    def: { ...mobDef, isBoss: isBossFloor },
    level,
    maxHp: baseHp,
    currentHp: baseHp,
    atk: baseAtk,
    defense: baseDef,
    xpReward: Math.floor(mobDef.baseXp * level * (1 + 0.02 * floor) * (isBossFloor ? 3 : 1)),
    goldReward: Math.floor(mobDef.baseGold * level * (1 + 0.03 * floor) * (isBossFloor ? 4 : 1)),
    attackSpeed: isBossFloor ? 0.7 + Math.min(0.2, 0.004 * floor) : 0.9 + Math.min(0.3, 0.005 * floor),
  };

  state.combat.currentMob = mob;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.isPlayerDead = false;

  if (isBossFloor) {
    addLog(state, `Abyss Boss: ${mobDef.name} (Floor ${floor}, Lv.${level})!`, 'info');
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
  addPopup(state, dmgDealt, 'mob', 'damage', isCrit);
  state.combat.playerDamageLog.push({ timestamp: Date.now(), amount: dmgDealt });

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
    addPopup(state, 0, 'player', 'dodge');
    addLog(state, `You dodged ${mob.def.name}'s attack!`, 'info');
    return { playerDied: false };
  }

  const rawDmg = mob.atk * (0.9 + Math.random() * 0.2);
  const dmgTaken = Math.max(1, Math.floor(rawDmg - derived.defense));

  state.character.currentHp -= dmgTaken;
  addPopup(state, dmgTaken, 'player', 'damage');
  state.combat.mobDamageLog.push({ timestamp: Date.now(), amount: dmgTaken });

  addLog(state, `${mob.def.name} deals ${dmgTaken} damage to you`, 'playerDamage');

  if (state.character.currentHp <= 0) {
    state.character.currentHp = 0;
    state.combat.isPlayerDead = true;
    state.combatActive = false; // Stop combat immediately

    // Capture death info for modal
    const zone = getZone(state.currentZoneId);
    state.combat.deathInfo = {
      killerName: mob.def.name,
      killerLevel: mob.level,
      killerAtk: mob.atk,
      killerDef: mob.defense,
      zoneId: state.currentZoneId,
      zoneName: zone?.name ?? 'Unknown',
      wasEndless: state.endless.active,
      endlessFloor: state.endless.active ? state.endless.currentFloor : undefined,
    };

    addLog(state, 'You have been defeated!', 'death');
    return { playerDied: true };
  }
  return { playerDied: false };
}

// --- Death handling (called from UI modal buttons) ---

function resetCombatState(state: GameState, derived: DerivedStats): void {
  state.character.currentHp = derived.maxHp;
  state.combat.isPlayerDead = false;
  state.combat.deathInfo = null;
  state.combat.killCount = 0;
  state.combat.currentMob = null;
  state.combat.playerAttackProgress = 0;
  state.combat.mobAttackProgress = 0;
  state.combat.playerDamageLog = [];
  state.combat.mobDamageLog = [];
}

function relockZonesOnDeath(state: GameState): void {
  if (state.endless.active) return;

  const deathZoneId = state.currentZoneId;

  // Re-lock current zone and all zones after it
  state.unlockedZoneIds = state.unlockedZoneIds.filter(id => id < deathZoneId);
  state.bossesDefeated = state.bossesDefeated.filter(id => id < deathZoneId);

  // Zone 1 must always be unlocked
  if (!state.unlockedZoneIds.includes(1)) {
    state.unlockedZoneIds = [1];
  }
}

export function handleDeathRetreat(state: GameState, derived: DerivedStats): void {
  // Endless mode: end the run
  if (state.endless.active) {
    if (state.endless.currentFloor > state.endless.highestFloor) {
      state.endless.highestFloor = state.endless.currentFloor;
    }
    addLog(state, `You fell on Floor ${state.endless.currentFloor} of The Abyss!`, 'death');
    state.endless.active = false;
    resetCombatState(state, derived);
    return;
  }

  // Re-lock zones on retreat
  relockZonesOnDeath(state);

  // Move to highest remaining unlocked zone
  const maxUnlocked = Math.max(...state.unlockedZoneIds);
  if (state.currentZoneId > maxUnlocked) {
    state.currentZoneId = maxUnlocked;
  }

  addLog(state, `Retreated to zone ${state.currentZoneId}`, 'info');
  resetCombatState(state, derived);
}

export function handleDeathRetry(state: GameState, derived: DerivedStats): void {
  // Endless mode: end the run (no retry in endless)
  if (state.endless.active) {
    handleDeathRetreat(state, derived);
    return;
  }

  // Stay in same zone, restart combat, no re-locking
  addLog(state, `Trying again in zone ${state.currentZoneId}...`, 'info');
  resetCombatState(state, derived);
  state.combatActive = true;
}

// Legacy handler for gameLoop compatibility (now only used for endless auto-death)
export function handlePlayerDeath(state: GameState, derived: DerivedStats): void {
  // For normal mode, death is now handled by the modal — this should not be called
  // Only keep for safety: if somehow reached, treat as retreat
  if (!state.endless.active && state.combat.deathInfo) {
    return; // Wait for modal
  }

  // Endless mode auto-handle (fallback)
  if (state.endless.active) {
    handleDeathRetreat(state, derived);
  }
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
