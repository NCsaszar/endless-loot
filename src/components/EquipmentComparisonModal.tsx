import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Item, EquipSlot, DerivedStats, GameState, Affix } from '../types';
import { RARITY_COLORS } from '../types';
import { getTotalPrimaryStats, calculateDerivedStats } from '../data/formulas';
import { sheetDps, computeItemDpsDelta } from '../systems/dps';
import { formatAffix } from '../data/affixes';

interface EquipmentComparisonModalProps {
  slot: EquipSlot;
  equippedItem: Item | null;
  inventoryItems: Item[];
  state: GameState;
  derived: DerivedStats;
  onEquip: (item: Item) => void;
  onUnequip: () => void;
  onClose: () => void;
}

function ItemFullCard({ item, label }: { item: Item | null; label: string }) {
  if (!item) {
    return (
      <div className="ecm-item-card ecm-empty">
        <div className="ecm-card-label">{label}</div>
        <div className="ecm-empty-text">Empty Slot</div>
      </div>
    );
  }

  const color = RARITY_COLORS[item.rarity];
  const filledPrefixes = item.prefixes.filter((a): a is Affix => a !== null);
  const filledSuffixes = item.suffixes.filter((a): a is Affix => a !== null);
  const isAttackSlot = item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet';

  return (
    <div className="ecm-item-card" style={{ borderColor: color }}>
      <div className="ecm-card-label">{label}</div>
      <div className="ecm-item-name" style={{ color }}>{item.name}</div>
      <div className="ecm-item-meta">
        <span style={{ color }}>({item.rarity})</span> &middot; Lv.{item.itemLevel}
      </div>
      <div className="ecm-item-stat">+{item.primaryStatValue} {isAttackSlot ? 'ATK' : 'DEF'}</div>
      <div className="ecm-item-stat">+{item.randomPrimaryStatValue} {item.randomPrimaryStat.toUpperCase()}</div>
      {(filledPrefixes.length > 0 || filledSuffixes.length > 0) && (
        <div className="ecm-affixes">
          {filledPrefixes.map((a, i) => (
            <div key={`p${i}`} style={{ color: '#ffcc44', fontSize: '0.85em' }}>{formatAffix(a)}</div>
          ))}
          {filledSuffixes.map((a, i) => (
            <div key={`s${i}`} style={{ color: '#44ccff', fontSize: '0.85em' }}>{formatAffix(a)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EquipmentComparisonModal({
  slot, equippedItem, inventoryItems, state, derived, onEquip, onUnequip, onClose,
}: EquipmentComparisonModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ item: Item; rect: DOMRect } | null>(null);

  // Sort by DPS delta descending
  const sortedItems = useMemo(() => {
    return inventoryItems
      .filter(i => !i.consumable)
      .map(item => ({ item, delta: computeItemDpsDelta(item, state, derived) }))
      .sort((a, b) => b.delta - a.delta);
  }, [inventoryItems, state, derived]);

  const selectedItem = sortedItems.find(s => s.item.id === selectedId)?.item ?? null;

  // Compute hypothetical derived stats when an inventory item is selected
  const newDerived = useMemo(() => {
    if (!selectedItem) return null;
    const hypotheticalEquipment = { ...state.equipment, [slot]: selectedItem };
    const hypotheticalPrimary = getTotalPrimaryStats(state.character, hypotheticalEquipment);
    return calculateDerivedStats(hypotheticalPrimary, hypotheticalEquipment);
  }, [selectedItem, state, slot]);

  const currentSheetDps = sheetDps(derived);
  const newSheetDps = newDerived ? sheetDps(newDerived) : currentSheetDps;
  const dpsDiff = newSheetDps - currentSheetDps;
  const dpsPct = currentSheetDps > 0 ? dpsDiff / currentSheetDps : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ecm-modal" onClick={e => e.stopPropagation()}>
        <div className="ecm-header">
          <h2>{slot.charAt(0).toUpperCase() + slot.slice(1)} Comparison</h2>
          <button className="ecm-close" onClick={onClose}>&times;</button>
        </div>

        <div className="ecm-body">
          {/* Left side: equipped item */}
          <div className="ecm-left">
            <ItemFullCard item={equippedItem} label="Equipped" />
            {equippedItem && (
              <button className="btn-secondary ecm-unequip" onClick={() => { onUnequip(); onClose(); }}>
                Unequip
              </button>
            )}
          </div>

          {/* Right side: inventory list */}
          <div className="ecm-right">
            <div className="ecm-inv-label">Inventory ({sortedItems.length})</div>
            {sortedItems.length === 0 ? (
              <div className="ecm-empty-text">No {slot} items in inventory</div>
            ) : (
              <div className="ecm-inv-list">
                {sortedItems.map(({ item, delta }) => {
                  const sign = delta > 0 ? '+' : '';
                  const cls = delta > 0.02 ? 'positive' : delta < -0.02 ? 'negative' : 'neutral';
                  const isSelected = item.id === selectedId;
                  return (
                    <div
                      key={item.id}
                      className={`ecm-inv-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedId(isSelected ? null : item.id)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredItem({ item, rect });
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span className="ecm-inv-name" style={{ color: RARITY_COLORS[item.rarity] }}>
                        {item.name}
                      </span>
                      <span className="ecm-inv-level">Lv.{item.itemLevel}</span>
                      <span className={`ecm-inv-delta ${cls}`}>
                        {sign}{(delta * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Comparison section */}
        {selectedItem && newDerived && (
          <div className="ecm-comparison">
            <div className="ecm-compare-cards">
              <ItemFullCard item={equippedItem} label="Current" />
              <div className="ecm-arrow">&rarr;</div>
              <ItemFullCard item={selectedItem} label="New" />
            </div>

            <div className="ecm-dps-summary">
              <span className="ecm-delta-label">DPS</span>
              <span>{currentSheetDps.toFixed(1)}</span>
              <span className="delta-arrow">&rarr;</span>
              <span>{newSheetDps.toFixed(1)}</span>
              <span className={dpsDiff > 0 ? 'positive' : dpsDiff < 0 ? 'negative' : 'neutral'}>
                ({dpsDiff > 0 ? '+' : ''}{dpsDiff.toFixed(1)})
              </span>
              <span className={`ecm-badge ${dpsPct > 0.02 ? 'upgrade' : dpsPct < -0.02 ? 'downgrade' : 'sidegrade'}`}>
                {dpsPct > 0.02 ? 'Upgrade' : dpsPct < -0.02 ? 'Downgrade' : 'Sidegrade'}
              </span>
            </div>

            <button className="btn-equip ecm-equip-btn" onClick={() => { onEquip(selectedItem); onClose(); }}>
              Equip {selectedItem.name}
            </button>
          </div>
        )}
      </div>

      {/* Hover preview tooltip */}
      {hoveredItem && createPortal(
        <div
          className="ecm-hover-tooltip"
          style={{
            position: 'fixed',
            top: hoveredItem.rect.top,
            ...(hoveredItem.rect.left < 260
              ? { left: hoveredItem.rect.right + 8 }
              : { left: hoveredItem.rect.left - 8, transform: 'translateX(-100%)' }),
          }}
        >
          {(() => {
            const item = hoveredItem.item;
            const color = RARITY_COLORS[item.rarity];
            const isAttackSlot = item.slot === 'weapon' || item.slot === 'ring' || item.slot === 'amulet';
            const filledPrefixes = item.prefixes.filter((a): a is Affix => a !== null);
            const filledSuffixes = item.suffixes.filter((a): a is Affix => a !== null);
            return (
              <>
                <div className="ecm-hover-name" style={{ color }}>{item.name}</div>
                <div className="ecm-hover-meta">
                  <span style={{ color }}>({item.rarity})</span> &middot; Lv.{item.itemLevel}
                </div>
                <div className="ecm-hover-stat">+{item.primaryStatValue} {isAttackSlot ? 'ATK' : 'DEF'}</div>
                <div className="ecm-hover-stat">+{item.randomPrimaryStatValue} {item.randomPrimaryStat.toUpperCase()}</div>
                {filledPrefixes.map((a, i) => (
                  <div key={`p${i}`} className="ecm-hover-affix" style={{ color: '#ffcc44' }}>{formatAffix(a)}</div>
                ))}
                {filledSuffixes.map((a, i) => (
                  <div key={`s${i}`} className="ecm-hover-affix" style={{ color: '#44ccff' }}>{formatAffix(a)}</div>
                ))}
              </>
            );
          })()}
        </div>,
        document.body,
      )}
    </div>
  );
}
