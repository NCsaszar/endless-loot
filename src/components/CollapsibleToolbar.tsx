import { useState } from 'react';
import type { EquipSlot, Rarity, BulkActionMode } from '../types';
import { ALL_EQUIP_SLOTS, SLOT_LABELS, EQUIPMENT_RARITIES, RARITY_COLORS } from '../types';

export type SortBy = 'rarity' | 'level' | 'slot' | 'value';

interface CollapsibleToolbarProps {
  sortBy: SortBy;
  onSortChange: (s: SortBy) => void;
  filterSlot: EquipSlot | 'all';
  onFilterSlotChange: (s: EquipSlot | 'all') => void;
  filterRarity: Rarity | 'all';
  onFilterRarityChange: (r: Rarity | 'all') => void;
  onBulkAction: (mode: BulkActionMode) => void;
  onSellNonUpgrades: () => void;
  autoSellRarities: Rarity[];
  autoSalvageRarities: Rarity[];
  onToggleAutoSell: (r: Rarity) => void;
  onToggleAutoSalvage: (r: Rarity) => void;
}

export default function CollapsibleToolbar({
  sortBy, onSortChange,
  filterSlot, onFilterSlotChange,
  filterRarity, onFilterRarityChange,
  onBulkAction, onSellNonUpgrades,
  autoSellRarities, autoSalvageRarities,
  onToggleAutoSell, onToggleAutoSalvage,
}: CollapsibleToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const autoSellCount = autoSellRarities.length;
  const autoSalvCount = autoSalvageRarities.length;

  return (
    <div className="inv-toolbar collapsible-toolbar">
      <div className="toolbar-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="toolbar-summary">
          <span className="toolbar-chip">Sort: {sortBy}</span>
          <span className="toolbar-chip">Slot: {filterSlot === 'all' ? 'All' : SLOT_LABELS[filterSlot]}</span>
          <span className="toolbar-chip">Rarity: {filterRarity === 'all' ? 'All' : filterRarity}</span>
          {(autoSellCount > 0 || autoSalvCount > 0) && (
            <span className="toolbar-chip toolbar-chip-auto">
              {autoSellCount > 0 && <span style={{ color: 'var(--gold)' }}>Sell:{autoSellCount}</span>}
              {autoSellCount > 0 && autoSalvCount > 0 && ' '}
              {autoSalvCount > 0 && <span style={{ color: '#aa44ff' }}>Salv:{autoSalvCount}</span>}
            </span>
          )}
        </div>
        <button className="toolbar-toggle" title={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}>
          <span className={`toolbar-chevron ${collapsed ? 'collapsed' : ''}`}>&#9660;</span>
        </button>
      </div>

      <div className={`toolbar-body ${collapsed ? 'collapsed' : 'expanded'}`}>
        <div className="inv-toolbar-row">
          <div className="inv-sort">
            <label>Sort:</label>
            {(['rarity', 'level', 'slot', 'value'] as SortBy[]).map(s => (
              <button key={s} className={sortBy === s ? 'active' : ''} onClick={() => onSortChange(s)}>
                {s}
              </button>
            ))}
          </div>
          <select value={filterSlot} onChange={e => onFilterSlotChange(e.target.value as EquipSlot | 'all')}>
            <option value="all">All Slots</option>
            {ALL_EQUIP_SLOTS.map(s => (
              <option key={s} value={s}>{SLOT_LABELS[s]}</option>
            ))}
          </select>
          <select value={filterRarity} onChange={e => onFilterRarityChange(e.target.value as Rarity | 'all')}>
            <option value="all">All Rarities</option>
            {EQUIPMENT_RARITIES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <div className="inv-bulk-actions">
            <button className="btn-bulk-action btn-bulk-sell" onClick={() => onBulkAction('sell')}>
              Sell Filtered
            </button>
            <button className="btn-bulk-action btn-bulk-salvage" onClick={() => onBulkAction('salvage')}>
              Salvage Filtered
            </button>
            <button className="btn-bulk-action btn-bulk-sell" onClick={onSellNonUpgrades}>
              Sell Non-Upgrades
            </button>
          </div>
        </div>
        <div className="inv-toolbar-row">
          <span className="auto-sell-label">Auto-sell:</span>
          {EQUIPMENT_RARITIES.map(r => (
            <button
              key={`sell-${r}`}
              className={`auto-sell-toggle ${autoSellRarities.includes(r) ? 'active' : ''}`}
              style={{
                borderColor: RARITY_COLORS[r],
                ...(autoSellRarities.includes(r) ? { background: RARITY_COLORS[r] + '33' } : {}),
              }}
              onClick={() => onToggleAutoSell(r)}
            >
              {r}
            </button>
          ))}
          <span className="auto-sell-label" style={{ marginLeft: 10 }}>Auto-salvage:</span>
          {EQUIPMENT_RARITIES.map(r => (
            <button
              key={`salv-${r}`}
              className={`auto-sell-toggle ${autoSalvageRarities.includes(r) ? 'active' : ''}`}
              style={{
                borderColor: RARITY_COLORS[r],
                ...(autoSalvageRarities.includes(r) ? { background: RARITY_COLORS[r] + '33' } : {}),
              }}
              onClick={() => onToggleAutoSalvage(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="toolbar-hint">
          Shift+click to sell &middot; Ctrl+click to salvage
        </div>
      </div>
    </div>
  );
}
