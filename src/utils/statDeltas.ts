import type { DerivedStats } from '../types';
import { sheetDps } from '../systems/dps';

export interface StatDelta {
  label: string;
  current: string;
  next: string;
  diff: number;
  format: (n: number) => string;
}

function formatPercent(n: number): string { return `${(n * 100).toFixed(1)}%`; }
function formatNum(n: number): string { return Math.floor(n).toString(); }
function formatSpeed(n: number): string { return `${n.toFixed(2)}/s`; }

export function computeStatDeltas(currentDerived: DerivedStats, newDerived: DerivedStats): StatDelta[] {
  return [
    { label: 'ATK', current: formatNum(currentDerived.attackPower), next: formatNum(newDerived.attackPower), diff: newDerived.attackPower - currentDerived.attackPower, format: formatNum },
    { label: 'DEF', current: formatNum(currentDerived.defense), next: formatNum(newDerived.defense), diff: newDerived.defense - currentDerived.defense, format: formatNum },
    { label: 'HP', current: formatNum(currentDerived.maxHp), next: formatNum(newDerived.maxHp), diff: newDerived.maxHp - currentDerived.maxHp, format: formatNum },
    { label: 'SPD', current: formatSpeed(currentDerived.attackSpeed), next: formatSpeed(newDerived.attackSpeed), diff: newDerived.attackSpeed - currentDerived.attackSpeed, format: (n) => n.toFixed(3) },
    { label: 'CRIT', current: formatPercent(currentDerived.critChance), next: formatPercent(newDerived.critChance), diff: newDerived.critChance - currentDerived.critChance, format: (n) => `${(n * 100).toFixed(1)}%` },
    { label: 'CDMG', current: `${(currentDerived.critDamage * 100).toFixed(0)}%`, next: `${(newDerived.critDamage * 100).toFixed(0)}%`, diff: newDerived.critDamage - currentDerived.critDamage, format: (n) => `${(n * 100).toFixed(0)}%` },
    { label: 'DODGE', current: formatPercent(currentDerived.dodgeChance), next: formatPercent(newDerived.dodgeChance), diff: newDerived.dodgeChance - currentDerived.dodgeChance, format: (n) => `${(n * 100).toFixed(1)}%` },
    { label: 'REGEN', current: `${currentDerived.hpRegen.toFixed(1)}/s`, next: `${newDerived.hpRegen.toFixed(1)}/s`, diff: newDerived.hpRegen - currentDerived.hpRegen, format: (n) => `${n.toFixed(1)}/s` },
  ];
}

export function computeDpsDelta(currentDerived: DerivedStats, newDerived: DerivedStats) {
  const currentSheetDps = sheetDps(currentDerived);
  const newSheetDps = sheetDps(newDerived);
  const dpsDiff = newSheetDps - currentSheetDps;
  const dpsPct = currentSheetDps > 0 ? dpsDiff / currentSheetDps : 0;

  let badge: { label: string; cls: string };
  if (dpsPct > 0.02) badge = { label: 'Upgrade', cls: 'upgrade' };
  else if (dpsPct < -0.02) badge = { label: 'Downgrade', cls: 'downgrade' };
  else badge = { label: 'Sidegrade', cls: 'sidegrade' };

  return { currentSheetDps, newSheetDps, dpsDiff, dpsPct, badge };
}
