import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { EquipSlot, Rarity, Item, BulkActionMode } from '../types';
import { RARITY_ORDER, RARITY_COLORS, ALL_EQUIP_SLOTS, SLOT_LABELS } from '../types';
import { getTotalPrimaryStats, calculateDerivedStats } from '../data/formulas';
import { computeItemDpsDelta } from '../systems/dps';
import ItemCard from './ItemCard';
import ComparisonModal from './ComparisonModal';
import BulkActionConfirmModal from './BulkActionConfirmModal';

type SortBy = 'rarity' | 'level' | 'slot' | 'value';

export default function InventoryPanel() {
  const { state, derived, doSellItem, doSalvageItem, doEquipItem, doToggleAutoSell, doToggleAutoSalvage, doToggleLock, doBulkSell, doBulkSalvage } = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('rarity');
  const [filterSlot, setFilterSlot] = useState<EquipSlot | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [bulkAction, setBulkAction] = useState<{ items: Item[]; mode: BulkActionMode } | null>(null);
  const [sellBelowLevel, setSellBelowLevel] = useState(5);

  // Filter for display (uses >= for rarity)
  const items = useMemo(() => {
    let result = [...state.inventory];
    if (filterSlot !== 'all') result = result.filter(i => i.slot === filterSlot);
    if (filterRarity !== 'all') {
      const minIdx = RARITY_ORDER.indexOf(filterRarity);
      result = result.filter(i => RARITY_ORDER.indexOf(i.rarity) >= minIdx);
    }
    result.sort((a, b) => {
      if (sortBy === 'rarity') return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
      if (sortBy === 'level') return b.itemLevel - a.itemLevel;
      if (sortBy === 'slot') return a.slot.localeCompare(b.slot);
      return b.sellValue - a.sellValue;
    });
    return result;
  }, [state.inventory, filterSlot, filterRarity, sortBy]);

  // Compute upgrade status for each item
  const upgradeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.inventory) {
      map.set(item.id, computeItemDpsDelta(item, state, derived));
    }
    return map;
  }, [state.inventory, state.equipment, state.character, state.trainingLevels, derived]);

  const selected = items.find(i => i.id === selectedId) ?? null;

  // Compute "what-if" derived stats when an item is selected
  const equipped = selected ? (state.equipment[selected.slot] ?? null) : null;
  let newDerived = derived;
  if (selected) {
    const hypotheticalEquipment = { ...state.equipment, [selected.slot]: selected };
    const hypotheticalPrimary = getTotalPrimaryStats(state.character, state.trainingLevels, hypotheticalEquipment);
    newDerived = calculateDerivedStats(hypotheticalPrimary, hypotheticalEquipment);
  }

  const handleSell = () => {
    if (selectedId) { doSellItem(selectedId); setSelectedId(null); }
  };
  const handleSalvage = () => {
    if (selectedId) { doSalvageItem(selectedId); setSelectedId(null); }
  };
  const handleEquip = () => {
    if (selected) { doEquipItem(selected); setSelectedId(null); }
  };

  // Get items matching current filters for bulk actions (exact rarity match, not >= like display)
  const handleBulkAction = (mode: BulkActionMode) => {
    let result = state.inventory.filter(i => !i.locked);
    if (filterSlot !== 'all') result = result.filter(i => i.slot === filterSlot);
    if (filterRarity !== 'all') result = result.filter(i => i.rarity === filterRarity);
    if (result.length > 0) setBulkAction({ items: result, mode });
  };

  const handleSellNonUpgrades = () => {
    const toSell = state.inventory.filter(item => {
      if (item.locked) return false;
      const delta = upgradeMap.get(item.id) ?? 0;
      return delta <= 0.02;
    });
    if (toSell.length > 0) setBulkAction({ items: toSell, mode: 'sell' });
  };

  const handleSellBelowLevel = () => {
    const toSell = state.inventory.filter(item => {
      if (item.locked) return false;
      return item.itemLevel < sellBelowLevel;
    });
    if (toSell.length > 0) setBulkAction({ items: toSell, mode: 'sell' });
  };

  const confirmBulkAction = () => {
    if (!bulkAction) return;
    const ids = bulkAction.items.map(i => i.id);
    if (bulkAction.mode === 'sell') doBulkSell(ids);
    else doBulkSalvage(ids);
    setBulkAction(null);
    setSelectedId(null);
  };

  const emptySlotCount = Math.max(0, 60 - items.length);

  return (
    <div className="inventory-panel">
      <div className="inv-header">
        <h2>Inventory ({state.inventory.length})</h2>
        <div className="inv-gold">Gold: {state.gold.toLocaleString()}</div>
      </div>

      <div className="inv-controls">
        <div className="inv-sort">
          <label>Sort:</label>
          {(['rarity', 'level', 'slot', 'value'] as SortBy[]).map(s => (
            <button key={s} className={sortBy === s ? 'active' : ''} onClick={() => setSortBy(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="inv-filter">
          <select value={filterSlot} onChange={e => setFilterSlot(e.target.value as EquipSlot | 'all')}>
            <option value="all">All Slots</option>
            {ALL_EQUIP_SLOTS.map(s => (
              <option key={s} value={s}>{SLOT_LABELS[s]}</option>
            ))}
          </select>
          <select value={filterRarity} onChange={e => setFilterRarity(e.target.value as Rarity | 'all')}>
            <option value="all">All Rarities</option>
            {RARITY_ORDER.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="inv-actions">
        <button className="btn-bulk-action btn-bulk-sell" onClick={() => handleBulkAction('sell')}>
          Sell Filtered
        </button>
        <button className="btn-bulk-action btn-bulk-salvage" onClick={() => handleBulkAction('salvage')}>
          Salvage Filtered
        </button>
        <button className="btn-bulk-action btn-bulk-sell" onClick={handleSellNonUpgrades}>
          Sell Non-Upgrades
        </button>
        <span className="sell-below-group">
          <button className="btn-bulk-action btn-bulk-sell" onClick={handleSellBelowLevel}>
            Sell Below Lv.
          </button>
          <input
            type="number"
            className="sell-level-input"
            value={sellBelowLevel}
            min={1}
            onChange={e => setSellBelowLevel(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </span>
      </div>

      <div className="auto-sell-group">
        <span className="auto-sell-label">Auto-sell:</span>
        {RARITY_ORDER.map(r => (
          <button
            key={r}
            className={`auto-sell-toggle ${state.autoSellRarities.includes(r) ? 'active' : ''}`}
            style={{
              borderColor: RARITY_COLORS[r],
              ...(state.autoSellRarities.includes(r) ? { background: RARITY_COLORS[r] + '33' } : {}),
            }}
            onClick={() => doToggleAutoSell(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="auto-sell-group">
        <span className="auto-sell-label">Auto-salvage:</span>
        {RARITY_ORDER.map(r => (
          <button
            key={r}
            className={`auto-sell-toggle ${state.autoSalvageRarities.includes(r) ? 'active' : ''}`}
            style={{
              borderColor: RARITY_COLORS[r],
              ...(state.autoSalvageRarities.includes(r) ? { background: RARITY_COLORS[r] + '33' } : {}),
            }}
            onClick={() => doToggleAutoSalvage(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="inv-grid-wrapper">
        <div className="inv-grid">
          {items.map(item => (
            <div key={item.id} className="inv-slot filled">
              <ItemCard
                item={item}
                grid
                selected={item.id === selectedId}
                upgradePct={upgradeMap.get(item.id) ?? 0}
                onToggleLock={() => doToggleLock(item.id)}
                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
              />
            </div>
          ))}
          {Array.from({ length: emptySlotCount }, (_, i) => (
            <div key={`empty-${i}`} className="inv-slot empty" />
          ))}
        </div>
      </div>

      {selected && (
        <ComparisonModal
          item={selected}
          equipped={equipped}
          currentDerived={derived}
          newDerived={newDerived}
          onEquip={handleEquip}
          onSell={handleSell}
          onSalvage={handleSalvage}
          onClose={() => setSelectedId(null)}
        />
      )}

      {bulkAction && (
        <BulkActionConfirmModal
          items={bulkAction.items}
          mode={bulkAction.mode}
          onConfirm={confirmBulkAction}
          onCancel={() => setBulkAction(null)}
        />
      )}
    </div>
  );
}
