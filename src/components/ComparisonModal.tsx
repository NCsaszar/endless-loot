import type { Item, DerivedStats } from '../types';
import { RARITY_COLORS } from '../types';
import { computeStatDeltas, computeDpsDelta } from '../utils/statDeltas';
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

export default function ComparisonModal({
  item, equipped, currentDerived, newDerived, onEquip, onSell, onSalvage, onClose,
}: ComparisonModalProps) {
  const color = RARITY_COLORS[item.rarity];
  const deltas = computeStatDeltas(currentDerived, newDerived);
  const { currentSheetDps, newSheetDps, dpsDiff, badge } = computeDpsDelta(currentDerived, newDerived);

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
