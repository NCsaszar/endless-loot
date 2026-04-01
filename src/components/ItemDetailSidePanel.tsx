import type { Item, DerivedStats, Affix } from '../types';
import { RARITY_COLORS } from '../types';
import { computeStatDeltas, computeDpsDelta } from '../utils/statDeltas';
import { formatAffix } from '../data/affixes';
import { SLOT_ICONS } from './icons';

interface ItemDetailSidePanelProps {
  item: Item;
  equipped: Item | null;
  currentDerived: DerivedStats;
  newDerived: DerivedStats;
  onEquip: () => void;
  onSell: () => void;
  onSalvage: () => void;
  onToggleLock: () => void;
  onClose: () => void;
}

export default function ItemDetailSidePanel({
  item, equipped, currentDerived, newDerived,
  onEquip, onSell, onSalvage, onToggleLock, onClose,
}: ItemDetailSidePanelProps) {
  const color = RARITY_COLORS[item.rarity];
  const deltas = computeStatDeltas(currentDerived, newDerived);
  const { currentSheetDps, newSheetDps, dpsDiff, badge } = computeDpsDelta(currentDerived, newDerived);
  const Icon = SLOT_ICONS[item.slot];

  const filledPrefixes = item.prefixes.filter((a): a is Affix => a !== null);
  const filledSuffixes = item.suffixes.filter((a): a is Affix => a !== null);

  return (
    <div className="item-detail-side-panel">
      <button className="side-panel-close" onClick={onClose} title="Close">&times;</button>

      <div className="side-panel-header">
        <Icon size={28} color={color} />
        <div>
          <div className="side-panel-name" style={{ color }}>{item.name}</div>
          <div className="side-panel-meta">
            <span style={{ color }}>({item.rarity})</span> &middot; {item.slot} &middot; Lv.{item.itemLevel}
          </div>
        </div>
      </div>

      <div className="side-panel-section">
        <div className="side-panel-stat">
          +{item.primaryStatValue} {item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet' ? 'ATK' : 'DEF'}
        </div>
        <div className="side-panel-stat dim">
          +{item.randomPrimaryStatValue} {item.randomPrimaryStat.toUpperCase()}
        </div>
      </div>

      {(filledPrefixes.length > 0 || filledSuffixes.length > 0) && (
        <div className="side-panel-section side-panel-affixes">
          {filledPrefixes.map((a, i) => (
            <div key={`p${i}`} className="side-panel-affix" style={{ color: '#ffcc44' }}>{formatAffix(a)}</div>
          ))}
          {filledSuffixes.map((a, i) => (
            <div key={`s${i}`} className="side-panel-affix" style={{ color: '#44ccff' }}>{formatAffix(a)}</div>
          ))}
        </div>
      )}

      <div className="side-panel-divider" />

      <div className="side-panel-compare-header">
        vs. {equipped ? equipped.name : 'Empty Slot'}
      </div>

      <div className="side-panel-deltas">
        {deltas.map(d => {
          const cls = Math.abs(d.diff) < 0.001 ? 'neutral' : d.diff > 0 ? 'positive' : 'negative';
          const sign = d.diff > 0 ? '+' : '';
          return (
            <div key={d.label} className="side-panel-delta-row">
              <span className="delta-label">{d.label}</span>
              <span className="delta-values">
                {d.current} <span className="delta-arrow">&rarr;</span> {d.next}
              </span>
              <span className={`delta-diff ${cls}`}>
                {Math.abs(d.diff) < 0.001 ? '=' : `${sign}${d.format(d.diff)}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="side-panel-dps">
        <div className="side-panel-dps-row">
          <span>Sheet DPS</span>
          <span>
            {currentSheetDps.toFixed(1)} <span className="delta-arrow">&rarr;</span> {newSheetDps.toFixed(1)}
          </span>
          <span className={dpsDiff > 0 ? 'positive' : dpsDiff < 0 ? 'negative' : 'neutral'}>
            ({dpsDiff > 0 ? '+' : ''}{dpsDiff.toFixed(1)})
          </span>
        </div>
        <div className={`dps-badge ${badge.cls}`}>{badge.label}</div>
      </div>

      <div className="side-panel-actions">
        <button className="btn-equip" onClick={onEquip}>Equip</button>
        <button className="btn-sell" onClick={onSell}>Sell ({item.sellValue}g)</button>
        <button className="btn-salvage" onClick={onSalvage}>Salvage</button>
        <button className={`btn-lock ${item.locked ? 'active' : ''}`} onClick={onToggleLock}>
          {item.locked ? '\u{1F512} Locked' : '\u{1F513} Lock'}
        </button>
      </div>
    </div>
  );
}
