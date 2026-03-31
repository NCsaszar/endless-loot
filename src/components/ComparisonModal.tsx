import type { Item, DerivedStats } from '../types';
import { RARITY_COLORS } from '../types';
import { sheetDps } from '../systems/dps';
import ItemCard from './ItemCard';

interface ComparisonModalProps {
  item: Item;
  equipped: Item | null;
  currentDerived: DerivedStats;
  newDerived: DerivedStats;
  onEquip: () => void;
  onSell: () => void;
  onSalvage: () => void;
  onClose: () => void;
}

interface StatDelta {
  label: string;
  current: string;
  next: string;
  diff: number;
  format: (n: number) => string;
}

function formatPercent(n: number): string { return `${(n * 100).toFixed(1)}%`; }
function formatNum(n: number): string { return Math.floor(n).toString(); }
function formatSpeed(n: number): string { return `${n.toFixed(2)}/s`; }

export default function ComparisonModal({
  item, equipped, currentDerived, newDerived, onEquip, onSell, onSalvage, onClose,
}: ComparisonModalProps) {
  const color = RARITY_COLORS[item.rarity];

  const deltas: StatDelta[] = [
    { label: 'ATK', current: formatNum(currentDerived.attackPower), next: formatNum(newDerived.attackPower), diff: newDerived.attackPower - currentDerived.attackPower, format: formatNum },
    { label: 'DEF', current: formatNum(currentDerived.defense), next: formatNum(newDerived.defense), diff: newDerived.defense - currentDerived.defense, format: formatNum },
    { label: 'HP', current: formatNum(currentDerived.maxHp), next: formatNum(newDerived.maxHp), diff: newDerived.maxHp - currentDerived.maxHp, format: formatNum },
    { label: 'SPD', current: formatSpeed(currentDerived.attackSpeed), next: formatSpeed(newDerived.attackSpeed), diff: newDerived.attackSpeed - currentDerived.attackSpeed, format: (n) => n.toFixed(3) },
    { label: 'CRIT', current: formatPercent(currentDerived.critChance), next: formatPercent(newDerived.critChance), diff: newDerived.critChance - currentDerived.critChance, format: (n) => `${(n * 100).toFixed(1)}%` },
    { label: 'CDMG', current: `${(currentDerived.critDamage * 100).toFixed(0)}%`, next: `${(newDerived.critDamage * 100).toFixed(0)}%`, diff: newDerived.critDamage - currentDerived.critDamage, format: (n) => `${(n * 100).toFixed(0)}%` },
    { label: 'DODGE', current: formatPercent(currentDerived.dodgeChance), next: formatPercent(newDerived.dodgeChance), diff: newDerived.dodgeChance - currentDerived.dodgeChance, format: (n) => `${(n * 100).toFixed(1)}%` },
    { label: 'REGEN', current: `${currentDerived.hpRegen.toFixed(1)}/s`, next: `${newDerived.hpRegen.toFixed(1)}/s`, diff: newDerived.hpRegen - currentDerived.hpRegen, format: (n) => `${n.toFixed(1)}/s` },
  ];

  const currentSheetDps = sheetDps(currentDerived);
  const newSheetDps = sheetDps(newDerived);
  const dpsDiff = newSheetDps - currentSheetDps;
  const dpsPct = currentSheetDps > 0 ? dpsDiff / currentSheetDps : 0;

  let badge: { label: string; cls: string };
  if (dpsPct > 0.02) badge = { label: 'Upgrade', cls: 'upgrade' };
  else if (dpsPct < -0.02) badge = { label: 'Downgrade', cls: 'downgrade' };
  else badge = { label: 'Sidegrade', cls: 'sidegrade' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content comparison-modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ color }}>
          {item.name}
          <span className="comparison-slot">{item.slot} &middot; Lv.{item.itemLevel}</span>
        </h2>

        <div className="comparison-columns">
          <div className="comparison-col">
            <div className="comparison-col-label">New Item</div>
            <ItemCard item={item} />
          </div>
          <div className="comparison-col">
            <div className="comparison-col-label">Equipped</div>
            {equipped ? <ItemCard item={equipped} /> : <div className="comparison-empty">Empty slot</div>}
          </div>
        </div>

        <div className="stat-deltas">
          {deltas.map(d => {
            const cls = Math.abs(d.diff) < 0.001 ? 'neutral' : d.diff > 0 ? 'positive' : 'negative';
            const sign = d.diff > 0 ? '+' : '';
            return (
              <div key={d.label} className="stat-delta">
                <span className="delta-label">{d.label}</span>
                <span>{d.current}</span>
                <span className="delta-arrow">&rarr;</span>
                <span>{d.next}</span>
                <span className={cls}>({sign}{d.diff > 0 || d.diff < 0 ? d.format(d.diff) : '0'})</span>
              </div>
            );
          })}
        </div>

        <div className="dps-comparison">
          <div className="dps-row">
            <span>Sheet DPS</span>
            <span>{currentSheetDps.toFixed(1)}</span>
            <span className="delta-arrow">&rarr;</span>
            <span>{newSheetDps.toFixed(1)}</span>
            <span className={dpsDiff > 0 ? 'positive' : dpsDiff < 0 ? 'negative' : 'neutral'}>
              ({dpsDiff > 0 ? '+' : ''}{dpsDiff.toFixed(1)})
            </span>
          </div>
          <div className={`dps-badge ${badge.cls}`}>{badge.label}</div>
        </div>

        <div className="comparison-actions">
          <button className="btn-equip" onClick={onEquip}>Equip</button>
          <button className="btn-sell" onClick={onSell}>Sell ({item.sellValue}g)</button>
          <button className="btn-salvage" onClick={onSalvage}>Salvage</button>
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
