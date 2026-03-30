import type { Item, BulkActionMode } from '../types';
import { RARITY_COLORS } from '../types';

interface BulkActionConfirmModalProps {
  items: Item[];
  mode: BulkActionMode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BulkActionConfirmModal({ items, mode, onConfirm, onCancel }: BulkActionConfirmModalProps) {
  const isSell = mode === 'sell';
  const totalGold = isSell ? items.reduce((sum, i) => sum + i.sellValue, 0) : 0;

  const materialTotals = !isSell
    ? items.reduce((acc, item) => {
        const { material, amount } = item.salvageResult;
        acc[material] = (acc[material] ?? 0) + amount;
        return acc;
      }, {} as Record<string, number>)
    : null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content bulk-action-modal" onClick={e => e.stopPropagation()}>
        <h2>{isSell ? 'Sell' : 'Salvage'} {items.length} item{items.length !== 1 ? 's' : ''}?</h2>

        <div className="bulk-action-list">
          {items.map(item => (
            <div key={item.id} className="bulk-action-row">
              <span className="bulk-action-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                {item.name}
              </span>
              <span className="bulk-action-info">
                Lv.{item.itemLevel}
              </span>
              {isSell ? (
                <span className="bulk-action-gold">{item.sellValue}g</span>
              ) : (
                <span className="bulk-action-material">
                  {item.salvageResult.amount}x {item.salvageResult.material}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="bulk-action-total">
          {isSell ? (
            <>Total: {totalGold.toLocaleString()}g</>
          ) : materialTotals && (
            <div className="bulk-action-material-totals">
              {Object.entries(materialTotals).map(([mat, amt]) => (
                <span key={mat}>{amt}x {mat}</span>
              ))}
            </div>
          )}
        </div>

        <div className="comparison-actions">
          <button className={isSell ? 'btn-sell' : 'btn-salvage'} onClick={onConfirm}>
            Confirm {isSell ? 'Sell' : 'Salvage'}
          </button>
          <button className="btn-close" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
