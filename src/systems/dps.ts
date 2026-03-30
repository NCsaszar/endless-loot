import type { DamageEntry, DerivedStats, MobInstance } from '../types';

const DPS_WINDOW_MS = 10_000;

export function calculateActualDps(log: DamageEntry[], windowMs: number = DPS_WINDOW_MS): number {
  if (log.length === 0) return 0;
  const now = Date.now();
  const entries = log.filter(e => now - e.timestamp < windowMs);
  if (entries.length === 0) return 0;
  const totalDamage = entries.reduce((sum, e) => sum + e.amount, 0);
  const elapsed = Math.max(1000, now - entries[0].timestamp);
  return totalDamage / (elapsed / 1000);
}

export function sheetDps(derived: DerivedStats): number {
  return derived.attackPower * derived.attackSpeed * (1 + derived.critChance * (derived.critDamage - 1));
}

export function calculateTheoreticalPlayerDps(derived: DerivedStats, mobDefense: number): number {
  const avgHit = Math.max(1, derived.attackPower - mobDefense);
  const critMultiplier = 1 + derived.critChance * (derived.critDamage - 1);
  return avgHit * derived.attackSpeed * critMultiplier;
}

export function calculateTheoreticalMobDps(mob: MobInstance, playerDerived: DerivedStats): number {
  const avgHit = Math.max(1, mob.atk - playerDerived.defense);
  const dodgeFactor = 1 - playerDerived.dodgeChance;
  return avgHit * mob.attackSpeed * dodgeFactor;
}

export { DPS_WINDOW_MS };
