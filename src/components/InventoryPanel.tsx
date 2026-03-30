import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { EquipSlot, Rarity } from '../types';
import { RARITY_ORDER, RARITY_COLORS } from '../types';
import ItemCard from './ItemCard';

type SortBy = 'rarity' | 'level' | 'slot' | 'value';

export default function InventoryPanel() {
  const { state, doSellItem, doSalvageItem, doEquipItem } = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('rarity');
  const [filterSlot, setFilterSlot] = useState<EquipSlot | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');

  let items = [...state.inventory];

  // Filter
  if (filterSlot !== 'all') items = items.filter(i => i.slot === filterSlot);
  if (filterRarity !== 'all') {
    const minIdx = RARITY_ORDER.indexOf(filterRarity);
    items = items.filter(i => RARITY_ORDER.indexOf(i.rarity) >= minIdx);
  }

  // Sort
  items.sort((a, b) => {
    if (sortBy === 'rarity') return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    if (sortBy === 'level') return b.itemLevel - a.itemLevel;
    if (sortBy === 'slot') return a.slot.localeCompare(b.slot);
    return b.sellValue - a.sellValue;
  });

  const selected = items.find(i => i.id === selectedId) ?? null;

  const handleSell = () => {
    if (selectedId) { doSellItem(selectedId); setSelectedId(null); }
  };
  const handleSalvage = () => {
    if (selectedId) { doSalvageItem(selectedId); setSelectedId(null); }
  };
  const handleEquip = () => {
    if (selected) { doEquipItem(selected); setSelectedId(null); }
  };
  const handleSellAll = (rarity: Rarity) => {
    const toSell = state.inventory.filter(i => i.rarity === rarity);
    toSell.forEach(i => doSellItem(i.id));
    setSelectedId(null);
  };

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
            {(['weapon', 'offhand', 'helmet', 'chest', 'legs', 'boots', 'ring', 'amulet'] as EquipSlot[]).map(s => (
              <option key={s} value={s}>{s}</option>
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
        <button disabled={!selected} onClick={handleEquip}>Equip</button>
        <button disabled={!selected} onClick={handleSell}>Sell</button>
        <button disabled={!selected} onClick={handleSalvage}>Salvage</button>
        <span className="sell-all-group">
          Sell all:
          {(['common', 'uncommon'] as Rarity[]).map(r => (
            <button key={r} onClick={() => handleSellAll(r)} style={{ color: RARITY_COLORS[r] }}>
              {r}
            </button>
          ))}
        </span>
      </div>

      {selected && (
        <div className="inv-detail">
          <ItemCard item={selected} />
          {state.equipment[selected.slot] && (
            <div className="compare-section">
              <div className="compare-label">Currently Equipped:</div>
              <ItemCard item={state.equipment[selected.slot]!} />
            </div>
          )}
        </div>
      )}

      <div className="inv-list">
        {items.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            compact
            selected={item.id === selectedId}
            onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
          />
        ))}
        {items.length === 0 && <div className="inv-empty">No items</div>}
      </div>
    </div>
  );
}
