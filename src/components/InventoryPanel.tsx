import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { EquipSlot, Rarity, Item, BulkActionMode } from '../types';
import { RARITY_ORDER } from '../types';
import { getTotalPrimaryStats, calculateDerivedStats } from '../data/formulas';
import { computeItemDpsDelta } from '../systems/dps';
import CollapsibleToolbar, { type SortBy } from './CollapsibleToolbar';
import InventoryBagGrid from './InventoryBagGrid';
import ItemDetailSidePanel from './ItemDetailSidePanel';
import BulkActionConfirmModal from './BulkActionConfirmModal';
import EssenceViewer from './EssenceViewer';
import EssenceDiscardModal from './EssenceDiscardModal';

type InventorySubTab = 'equipment' | 'materials';

const MATERIAL_DEFS = [
  { key: 'scrap', name: 'Scrap', desc: 'Common salvage from dismantled gear', color: '#888' },
  { key: 'fragments', name: 'Fragments', desc: 'Refined material from uncommon+ gear', color: '#44cc44' },
  { key: 'crystals', name: 'Crystals', desc: 'Rare crystallized essence', color: '#4488ff' },
  { key: 'essences', name: 'Generic Essences', desc: 'Raw magical residue', color: '#aa44ff' },
  { key: 'legendaryShards', name: 'Legendary Shards', desc: 'Fragments of legendary power', color: '#ff8800' },
] as const;

export default function InventoryPanel() {
  const { state, derived, doSellItem, doSalvageItem, doEquipItem, doToggleAutoSell, doToggleAutoSalvage, doToggleLock, doBulkSell, doBulkSalvage, doDiscardEssences } = useGameState();
  const [subTab, setSubTab] = useState<InventorySubTab>('equipment');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('rarity');
  const [filterSlot, setFilterSlot] = useState<EquipSlot | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [bulkAction, setBulkAction] = useState<{ items: Item[]; mode: BulkActionMode } | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Track new loot items
  const [newLootIds, setNewLootIds] = useState<Set<string>>(new Set());
  const prevInventoryIdsRef = useRef<Set<string> | null>(null);
  if (!prevInventoryIdsRef.current) {
    prevInventoryIdsRef.current = new Set(state.inventory.map(i => i.id));
  }

  useEffect(() => {
    const prevIds = prevInventoryIdsRef.current!;
    const currentIds = new Set(state.inventory.map(i => i.id));
    const added = new Set<string>();
    for (const id of currentIds) {
      if (!prevIds.has(id)) added.add(id);
    }
    prevInventoryIdsRef.current = currentIds;
    if (added.size > 0) {
      setNewLootIds(prev => new Set([...prev, ...added]));
      const timeout = setTimeout(() => {
        setNewLootIds(prev => {
          const next = new Set(prev);
          for (const id of added) next.delete(id);
          return next;
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [state.inventory]);

  // Filter & sort items (exclude consumables from equipment tab)
  const items = useMemo(() => {
    let result = state.inventory.filter(i => !i.consumable);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inventory, filterSlot, filterRarity, sortBy]);

  // Compute upgrade status for each item
  const upgradeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.inventory) {
      map.set(item.id, computeItemDpsDelta(item, state, derived));
    }
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inventory, state.equipment, state.character, state.trainingLevels, derived]);

  const selected = items.find(i => i.id === selectedId) ?? null;

  // Compute hypothetical derived stats when an item is selected
  const equipped = selected ? (state.equipment[selected.slot] ?? null) : null;
  const newDerived = useMemo(() => {
    if (!selected) return derived;
    const hypotheticalEquipment = { ...state.equipment, [selected.slot]: selected };
    const hypotheticalPrimary = getTotalPrimaryStats(state.character, hypotheticalEquipment);
    return calculateDerivedStats(hypotheticalPrimary, hypotheticalEquipment);
  }, [selected, state.equipment, state.character, derived]);

  // Item actions
  const handleEquip = () => {
    if (selected) { doEquipItem(selected); setSelectedId(null); }
  };
  const handleSell = () => { if (selectedId) { doSellItem(selectedId); setSelectedId(null); } };
  const handleSalvage = () => { if (selectedId) { doSalvageItem(selectedId); setSelectedId(null); } };
  const handleToggleLock = () => { if (selectedId) doToggleLock(selectedId); };

  // Item click with modifier keys
  const handleItemClick = useCallback((item: Item, e: React.MouseEvent) => {
    if (e.shiftKey && !item.locked) { doSellItem(item.id); return; }
    if ((e.ctrlKey || e.metaKey) && !item.locked) { doSalvageItem(item.id); return; }
    setSelectedId(prev => item.id === prev ? null : item.id);
  }, [doSellItem, doSalvageItem]);

  // Bulk actions
  const handleBulkAction = (mode: BulkActionMode) => {
    let result = state.inventory.filter(i => !i.locked && !i.consumable);
    if (filterSlot !== 'all') result = result.filter(i => i.slot === filterSlot);
    if (filterRarity !== 'all') result = result.filter(i => i.rarity === filterRarity);
    if (result.length > 0) setBulkAction({ items: result, mode });
  };
  const handleSellNonUpgrades = () => {
    const toSell = state.inventory.filter(item => {
      if (item.locked || item.consumable) return false;
      const delta = upgradeMap.get(item.id) ?? 0;
      return delta <= 0.02;
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

  // Dummy drag handlers (no paper doll, but grid cells still support drag)
  const noopDragHandlers = useCallback((_itemId: string) => ({
    draggable: false,
    onDragStart: () => {},
    onDragEnd: () => {},
  }), []);

  return (
    <div className="inventory-panel-v2">
      <div className="panel-ornament panel-ornament-bl" />
      <div className="panel-ornament panel-ornament-br" />

      <div className="inv-v2-header">
        <h2>Inventory ({state.inventory.length})</h2>
        <div className="inv-subtabs">
          <button className={`inv-subtab ${subTab === 'equipment' ? 'active' : ''}`} onClick={() => setSubTab('equipment')}>
            Equipment
          </button>
          <button className={`inv-subtab ${subTab === 'materials' ? 'active' : ''}`} onClick={() => setSubTab('materials')}>
            Materials {state.essences.length > 0 && `(${state.essences.length})`}
          </button>
        </div>
        <div className="inv-gold">Gold: {state.gold.toLocaleString()}</div>
      </div>

      {subTab === 'materials' && (
        <div className="materials-view">
          <h3>Crafting Materials</h3>
          <div className="material-card-grid">
            {MATERIAL_DEFS.map(mat => {
              const count = state.materials[mat.key as keyof typeof state.materials];
              return (
                <div key={mat.key} className={`material-card ${count === 0 ? 'dimmed' : ''}`} style={{ borderColor: mat.color }}>
                  <div className="material-card-info">
                    <span className="material-card-name" style={{ color: mat.color }}>{mat.name}</span>
                    <span className="material-card-desc">{mat.desc}</span>
                  </div>
                  <span className="material-card-count">{count.toLocaleString()}</span>
                </div>
              );
            })}
            {(() => {
              const tomeCount = state.inventory.filter(i => i.consumable === 'stat_reset').length;
              return (
                <div className={`material-card material-card-unique ${tomeCount === 0 ? 'dimmed' : ''}`}>
                  <div className="material-card-info">
                    <span className="material-card-name" style={{ color: '#FF3366' }}>Tome of Unmaking</span>
                    <span className="material-card-desc">Resets all allocated stat points</span>
                  </div>
                  <span className="material-card-count">{tomeCount}</span>
                </div>
              );
            })()}
          </div>
          <div className="essence-inventory">
            <div className="essence-inv-header">
              <h3>Essences ({state.essences.length})</h3>
              {state.essences.length > 0 && (
                <button className="btn-secondary" onClick={() => setShowDiscardModal(true)}>
                  Discard Essences
                </button>
              )}
            </div>
            <EssenceViewer essences={state.essences} />
          </div>
          {showDiscardModal && (
            <EssenceDiscardModal
              essences={state.essences}
              onDiscard={doDiscardEssences}
              onClose={() => setShowDiscardModal(false)}
            />
          )}
        </div>
      )}

      {subTab === 'equipment' && (
        <>
          <CollapsibleToolbar
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterSlot={filterSlot}
            onFilterSlotChange={setFilterSlot}
            filterRarity={filterRarity}
            onFilterRarityChange={setFilterRarity}
            onBulkAction={handleBulkAction}
            onSellNonUpgrades={handleSellNonUpgrades}
            autoSellRarities={state.autoSellRarities}
            autoSalvageRarities={state.autoSalvageRarities}
            onToggleAutoSell={doToggleAutoSell}
            onToggleAutoSalvage={doToggleAutoSalvage}
          />

          <div className={`inv-main-content ${selected ? 'detail-open' : ''}`}>
            <InventoryBagGrid
              items={items}
              selectedId={selectedId}
              upgradeMap={upgradeMap}
              newLootIds={newLootIds}
              draggedItemId={null}
              dragHandlers={noopDragHandlers}
              onItemClick={handleItemClick}
              onToggleLock={doToggleLock}
              totalSlots={60}
            />

            {selected && (
              <ItemDetailSidePanel
                item={selected}
                equipped={equipped}
                currentDerived={derived}
                newDerived={newDerived}
                onEquip={handleEquip}
                onSell={handleSell}
                onSalvage={handleSalvage}
                onToggleLock={handleToggleLock}
                onClose={() => setSelectedId(null)}
              />
            )}
          </div>

          {bulkAction && (
            <BulkActionConfirmModal
              items={bulkAction.items}
              mode={bulkAction.mode}
              onConfirm={confirmBulkAction}
              onCancel={() => setBulkAction(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
