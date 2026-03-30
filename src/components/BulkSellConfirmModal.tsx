import type { Item } from '../types';
import { RARITY_COLORS } from '../types';

interface BulkSellConfirmModalProps {
  items: Item[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BulkSellConfirmModal({ items, onConfirm, onCancel }: BulkSellConfirmModalProps) {
  const totalGold = items.reduce((sum, i) => sum + i.sellValue, 0);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content bulk-sell-modal" onClick={e => e.stopPropagation()}>
        <h2>Sell {items.length} item{items.length !== 1 ? 's' : ''}?</h2>

        <div className="bulk-sell-list">
          {items.map(item => (
            <div key={item.id} className="bulk-sell-row">
              <span className="bulk-sell-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                {item.name}
              </span>
              <span className="bulk-sell-info">
                Lv.{item.itemLevel}
              </span>
              <span className="bulk-sell-gold">{item.sellValue}g</span>
            </div>
          ))}
        </div>

        <div className="bulk-sell-total">
          Total: {totalGold.toLocaleString()}g
        </div>

        <div className="comparison-actions">
          <button className="btn-sell" onClick={onConfirm}>Confirm Sell</button>
          <button className="btn-close" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
