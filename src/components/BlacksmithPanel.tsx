import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { Item, Affix, AffixSlotType, AffixId, Essence } from '../types';
import { RARITY_COLORS, EQUIPMENT_RARITIES } from '../types';
import { formatAffix, getAffixShortName } from '../data/affixes';
import { getEmptySlots, getSlottingCost, getUpgradeCost } from '../systems/blacksmith';
import ItemCard from './ItemCard';
import EssenceViewer from './EssenceViewer';

type BlacksmithTab = 'dismantle' | 'craft';

type CraftMode = 'slot' | 'upgrade';

function formatEssence(e: Essence): string {
  return `[T${e.tier}] +${(e.value * 100).toFixed(1)}% ${getAffixShortName(e.affixId)}`;
}

export default function BlacksmithPanel() {
  const { state, doDismantleItem, doBulkDismantle, doSlotEssence, doUpgradeEssence } = useGameState();

  const [activeTab, setActiveTab] = useState<BlacksmithTab>('dismantle');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dismantleResult, setDismantleResult] = useState<Essence[] | null>(null);

  // Bulk dismantle state
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ essences: Essence[]; itemCount: number } | null>(null);

  // Craft tab state
  const [craftItemId, setCraftItemId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ type: AffixSlotType; index: number } | null>(null);
  const [selectedEssenceId, setSelectedEssenceId] = useState<string | null>(null);
  const [craftSource, setCraftSource] = useState<'inventory' | 'equipped'>('inventory');
  const [craftMode, setCraftMode] = useState<CraftMode>('slot');
  const [upgradeTarget, setUpgradeTarget] = useState<{ affixId: AffixId; tier: number; slotType: AffixSlotType } | null>(null);

  // --- Dismantle Tab ---

  const dismantleItems = useMemo(() => {
    return state.inventory.filter(item => {
      if (item.locked || item.consumable) return false;
      return item.prefixes.some(a => a !== null) || item.suffixes.some(a => a !== null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.inventory, state.inventory.length]);

  const selectedDismantleItem = dismantleItems.find(i => i.id === selectedItemId) ?? null;

  const handleDismantle = () => {
    if (!selectedItemId) return;
    const result = doDismantleItem(selectedItemId);
    setDismantleResult(result);
    setSelectedItemId(null);
  };

  // --- Craft Tab ---

  // Show items that have empty slots OR filled affixes (for upgrades)
  const craftItems = useMemo(() => {
    const hasAnySlotOrAffix = (item: Item) => {
      const hasEmpty = getEmptySlots(item).length > 0;
      const hasAffix = item.prefixes.some(a => a !== null) || item.suffixes.some(a => a !== null);
      return hasEmpty || hasAffix;
    };
    if (craftSource === 'inventory') {
      return state.inventory.filter(item => !item.consumable && hasAnySlotOrAffix(item));
    }
    return Object.values(state.equipment).filter((item): item is Item =>
      item !== undefined && hasAnySlotOrAffix(item)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftSource, state.inventory, state.inventory.length, state.equipment]);

  const craftItem = craftItems.find(i => i.id === craftItemId) ?? null;

  const selectedEssence = selectedEssenceId
    ? state.essences.find(e => e.id === selectedEssenceId) ?? null
    : null;

  // Slot mode costs
  const slottingCost = selectedEssence ? getSlottingCost(selectedEssence.tier) : 0;
  const upgradeCost = selectedEssence ? getUpgradeCost(selectedEssence.tier) : 0;
  const activeCost = craftMode === 'upgrade' ? upgradeCost : slottingCost;
  const canAfford = state.gold >= activeCost;

  // Check for duplicate affix on the target item (only relevant in slot mode)
  const hasDuplicateAffix = useMemo(() => {
    if (craftMode === 'upgrade') return false; // In upgrade mode, duplicates are expected
    if (!craftItem || !selectedEssence) return false;
    const allExisting = [...craftItem.prefixes, ...craftItem.suffixes].filter((a): a is Affix => a !== null);
    return allExisting.some(a => a.id === selectedEssence.affixId);
  }, [craftItem, selectedEssence, craftMode]);

  const handleSlotEssence = () => {
    if (!craftItemId || !selectedEssenceId || !selectedSlot) return;
    const success = doSlotEssence(craftItemId, selectedEssenceId, selectedSlot.index);
    if (success) {
      setSelectedEssenceId(null);
      setSelectedSlot(null);
      // If the item no longer has empty slots, clear slot selection
      const updated = [...state.inventory, ...Object.values(state.equipment).filter(Boolean) as Item[]]
        .find(i => i.id === craftItemId);
      if (updated && getEmptySlots(updated).length === 0) {
        // Item may still have filled affixes for upgrade, don't deselect
      }
    }
  };

  const handleUpgradeEssence = () => {
    if (!craftItemId || !selectedEssenceId) return;
    const success = doUpgradeEssence(craftItemId, selectedEssenceId);
    if (success) {
      setSelectedEssenceId(null);
      setUpgradeTarget(null);
      setCraftMode('slot');
    }
  };

  const resetCraftSelection = () => {
    setSelectedSlot(null);
    setSelectedEssenceId(null);
    setCraftMode('slot');
    setUpgradeTarget(null);
  };

  return (
    <div className="blacksmith-panel">
      <h2>Blacksmith</h2>

      <div className="blacksmith-tabs">
        <button
          className={`bs-tab ${activeTab === 'dismantle' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dismantle'); setCraftItemId(null); resetCraftSelection(); }}
        >
          Dismantle
        </button>
        <button
          className={`bs-tab ${activeTab === 'craft' ? 'active' : ''}`}
          onClick={() => { setActiveTab('craft'); setSelectedItemId(null); setDismantleResult(null); }}
        >
          Craft
        </button>
      </div>

      {activeTab === 'dismantle' && (
        <div className="dismantle-section">
          <p className="bs-hint">Select an item to extract its affixes as essences (60% chance each). Use bulk select to dismantle multiple items at once.</p>

          {/* Bulk rarity quick-select buttons */}
          {dismantleItems.length > 0 && (
            <div className="bulk-rarity-buttons">
              {EQUIPMENT_RARITIES.map(r => {
                const count = dismantleItems.filter(i => i.rarity === r).length;
                if (count === 0) return null;
                const allSelected = dismantleItems.filter(i => i.rarity === r).every(i => bulkSelectedIds.has(i.id));
                return (
                  <button
                    key={r}
                    className={`bulk-rarity-btn ${allSelected ? 'active' : ''}`}
                    style={{
                      borderColor: RARITY_COLORS[r],
                      ...(allSelected ? { background: RARITY_COLORS[r] + '33' } : {}),
                    }}
                    onClick={() => {
                      const itemsOfRarity = dismantleItems.filter(i => i.rarity === r);
                      const next = new Set(bulkSelectedIds);
                      if (allSelected) {
                        itemsOfRarity.forEach(i => next.delete(i.id));
                      } else {
                        itemsOfRarity.forEach(i => next.add(i.id));
                      }
                      setBulkSelectedIds(next);
                      setSelectedItemId(null);
                    }}
                  >
                    {r} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {dismantleItems.length === 0 ? (
            <div className="bs-empty">No unlocked items with affixes to dismantle.</div>
          ) : (
            <div className="bs-item-grid">
              {dismantleItems.map(item => (
                <div key={item.id} className="inv-slot filled" style={{ position: 'relative' }}>
                  <div
                    className={`bulk-checkbox ${bulkSelectedIds.has(item.id) ? 'checked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = new Set(bulkSelectedIds);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      setBulkSelectedIds(next);
                    }}
                  >
                    {bulkSelectedIds.has(item.id) ? '\u2713' : ''}
                  </div>
                  <ItemCard
                    item={item}
                    grid
                    selected={item.id === selectedItemId}
                    onClick={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bulk dismantle summary bar */}
          {bulkSelectedIds.size > 0 && (
            <div className="bulk-summary-bar">
              <span>
                {bulkSelectedIds.size} item{bulkSelectedIds.size > 1 ? 's' : ''} selected
                {' \u00b7 '}
                {dismantleItems
                  .filter(i => bulkSelectedIds.has(i.id))
                  .reduce((sum, i) => sum + [...i.prefixes, ...i.suffixes].filter(a => a !== null).length, 0)
                } affixes
              </span>
              <button
                className="btn-danger bs-dismantle-btn"
                onClick={() => setShowBulkConfirm(true)}
              >
                Dismantle Selected ({bulkSelectedIds.size})
              </button>
            </div>
          )}

          {/* Single item detail panel */}
          {selectedDismantleItem && (
            <div className="bs-detail-panel">
              <h3 style={{ color: RARITY_COLORS[selectedDismantleItem.rarity] }}>
                {selectedDismantleItem.name}
              </h3>
              <div className="bs-detail-meta">
                {selectedDismantleItem.slot} &middot; Lv.{selectedDismantleItem.itemLevel} &middot; {selectedDismantleItem.rarity}
              </div>
              <div className="bs-affix-list">
                <div className="bs-affix-header">Affixes to extract:</div>
                {selectedDismantleItem.prefixes.filter((a): a is Affix => a !== null).map((a, i) => (
                  <div key={`p${i}`} className="bs-affix" style={{ color: '#ffcc44' }}>{formatAffix(a)}</div>
                ))}
                {selectedDismantleItem.suffixes.filter((a): a is Affix => a !== null).map((a, i) => (
                  <div key={`s${i}`} className="bs-affix" style={{ color: '#44ccff' }}>{formatAffix(a)}</div>
                ))}
              </div>
              <button className="btn-danger bs-dismantle-btn" onClick={handleDismantle}>
                Dismantle
              </button>
            </div>
          )}

          {/* Bulk confirm modal */}
          {showBulkConfirm && (
            <div className="modal-overlay" onClick={() => setShowBulkConfirm(false)}>
              <div className="modal-content dismantle-result" onClick={e => e.stopPropagation()}>
                <h3>Confirm Bulk Dismantle</h3>
                <p>Dismantle {bulkSelectedIds.size} item{bulkSelectedIds.size > 1 ? 's' : ''}?</p>
                <div className="dismantle-result-list" style={{ maxHeight: 200, overflow: 'auto' }}>
                  {dismantleItems.filter(i => bulkSelectedIds.has(i.id)).map(item => (
                    <div key={item.id} style={{ color: RARITY_COLORS[item.rarity], fontSize: '0.9em', padding: '2px 0' }}>
                      {item.name} ({item.rarity})
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    className="btn-danger"
                    onClick={() => {
                      const ids = Array.from(bulkSelectedIds);
                      const essences = doBulkDismantle(ids);
                      setBulkResult({ essences, itemCount: ids.length });
                      setBulkSelectedIds(new Set());
                      setShowBulkConfirm(false);
                      setSelectedItemId(null);
                    }}
                  >
                    Confirm Dismantle
                  </button>
                  <button className="btn-secondary" onClick={() => setShowBulkConfirm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Single dismantle result modal */}
          {dismantleResult !== null && (
            <div className="modal-overlay" onClick={() => setDismantleResult(null)}>
              <div className="modal-content dismantle-result" onClick={e => e.stopPropagation()}>
                <h3>Dismantle Result</h3>
                {dismantleResult.length === 0 ? (
                  <p>No essences were extracted. Bad luck!</p>
                ) : (
                  <div className="dismantle-result-list">
                    {dismantleResult.map(e => (
                      <div
                        key={e.id}
                        className="dismantle-result-item"
                        style={{ color: e.slotType === 'prefix' ? '#ffcc44' : '#44ccff' }}
                      >
                        {formatEssence(e)}
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn-secondary" onClick={() => setDismantleResult(null)}>Continue</button>
              </div>
            </div>
          )}

          {/* Bulk dismantle result modal */}
          {bulkResult !== null && (
            <div className="modal-overlay" onClick={() => setBulkResult(null)}>
              <div className="modal-content dismantle-result" onClick={e => e.stopPropagation()}>
                <h3>Bulk Dismantle Result</h3>
                <p>Dismantled {bulkResult.itemCount} item{bulkResult.itemCount > 1 ? 's' : ''}.</p>
                {bulkResult.essences.length === 0 ? (
                  <p>No essences were extracted. Bad luck!</p>
                ) : (
                  <>
                    <p>{bulkResult.essences.length} essence{bulkResult.essences.length > 1 ? 's' : ''} extracted:</p>
                    <div className="dismantle-result-list" style={{ maxHeight: 250, overflow: 'auto' }}>
                      {bulkResult.essences.map(e => (
                        <div
                          key={e.id}
                          className="dismantle-result-item"
                          style={{ color: e.slotType === 'prefix' ? '#ffcc44' : '#44ccff' }}
                        >
                          {formatEssence(e)}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <button className="btn-secondary" onClick={() => setBulkResult(null)}>Continue</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'craft' && (
        <div className="craft-section">
          <p className="bs-hint">Select an item, then click an empty slot to add an essence or click a filled affix to upgrade it.</p>

          <div className="craft-layout">
            <div className="craft-left">
              <div className="craft-source-toggle">
                <button
                  className={craftSource === 'inventory' ? 'active' : ''}
                  onClick={() => { setCraftSource('inventory'); setCraftItemId(null); resetCraftSelection(); }}
                >
                  Inventory
                </button>
                <button
                  className={craftSource === 'equipped' ? 'active' : ''}
                  onClick={() => { setCraftSource('equipped'); setCraftItemId(null); resetCraftSelection(); }}
                >
                  Equipped
                </button>
              </div>

              {craftItems.length === 0 ? (
                <div className="bs-empty">No items available for crafting.</div>
              ) : (
                <div className="bs-item-grid">
                  {craftItems.map(item => (
                    <div key={item.id} className="inv-slot filled">
                      <ItemCard
                        item={item}
                        grid
                        selected={item.id === craftItemId}
                        onClick={() => {
                          setCraftItemId(item.id === craftItemId ? null : item.id);
                          resetCraftSelection();
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {craftItem && (
                <div className="craft-item-slots">
                  <h4 style={{ color: RARITY_COLORS[craftItem.rarity] }}>{craftItem.name}</h4>
                  {craftMode === 'upgrade' && upgradeTarget && (
                    <div className="craft-mode-badge">
                      Upgrade Mode: {getAffixShortName(upgradeTarget.affixId)} T{upgradeTarget.tier}
                      <button className="craft-mode-cancel" onClick={resetCraftSelection}>&times;</button>
                    </div>
                  )}
                  <div className="craft-slots-grid">
                    <div className="craft-slot-column">
                      <span className="craft-slot-label">Prefixes</span>
                      {craftItem.prefixes.map((affix, idx) => (
                        <div
                          key={`p${idx}`}
                          className={`craft-slot ${affix === null ? 'available' : 'filled upgradable'} ${
                            selectedSlot?.type === 'prefix' && selectedSlot.index === idx ? 'selected' : ''
                          } ${upgradeTarget && affix && affix.id === upgradeTarget.affixId ? 'upgrade-target' : ''}`}
                          onClick={() => {
                            if (affix === null) {
                              // Empty slot — enter slot mode
                              setCraftMode('slot');
                              setUpgradeTarget(null);
                              setSelectedSlot({ type: 'prefix', index: idx });
                              setSelectedEssenceId(null);
                            } else {
                              // Filled slot — enter upgrade mode
                              setCraftMode('upgrade');
                              setUpgradeTarget({ affixId: affix.id, tier: affix.tier, slotType: affix.slotType });
                              setSelectedSlot(null);
                              setSelectedEssenceId(null);
                            }
                          }}
                        >
                          {affix ? (
                            <span style={{ color: '#ffcc44' }}>{formatAffix(affix)}</span>
                          ) : (
                            <span className="empty-slot-text">Empty</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="craft-slot-column">
                      <span className="craft-slot-label">Suffixes</span>
                      {craftItem.suffixes.map((affix, idx) => (
                        <div
                          key={`s${idx}`}
                          className={`craft-slot ${affix === null ? 'available' : 'filled upgradable'} ${
                            selectedSlot?.type === 'suffix' && selectedSlot.index === idx ? 'selected' : ''
                          } ${upgradeTarget && affix && affix.id === upgradeTarget.affixId ? 'upgrade-target' : ''}`}
                          onClick={() => {
                            if (affix === null) {
                              setCraftMode('slot');
                              setUpgradeTarget(null);
                              setSelectedSlot({ type: 'suffix', index: idx });
                              setSelectedEssenceId(null);
                            } else {
                              setCraftMode('upgrade');
                              setUpgradeTarget({ affixId: affix.id, tier: affix.tier, slotType: affix.slotType });
                              setSelectedSlot(null);
                              setSelectedEssenceId(null);
                            }
                          }}
                        >
                          {affix ? (
                            <span style={{ color: '#44ccff' }}>{formatAffix(affix)}</span>
                          ) : (
                            <span className="empty-slot-text">Empty</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="craft-right">
              {/* Slot mode: selecting an empty slot */}
              {craftMode === 'slot' && selectedSlot ? (
                <>
                  <h4>Select Essence ({selectedSlot.type})</h4>
                  <EssenceViewer
                    essences={state.essences}
                    selectable
                    selectedId={selectedEssenceId}
                    onSelect={setSelectedEssenceId}
                    filterSlotType={selectedSlot.type}
                  />

                  {selectedEssence && (
                    <div className="craft-confirmation">
                      <div className="craft-essence-preview" style={{ color: selectedEssence.slotType === 'prefix' ? '#ffcc44' : '#44ccff' }}>
                        {formatEssence(selectedEssence)}
                      </div>
                      <div className={`craft-cost ${canAfford ? '' : 'insufficient'}`}>
                        Cost: {slottingCost.toLocaleString()}g
                        {!canAfford && <span className="cost-warning"> (not enough gold)</span>}
                      </div>
                      {hasDuplicateAffix && (
                        <div className="craft-warning">Item already has this affix type! Click the existing affix to upgrade it instead.</div>
                      )}
                      <button
                        className="btn-primary bs-slot-btn"
                        disabled={!canAfford || hasDuplicateAffix}
                        onClick={handleSlotEssence}
                      >
                        Slot Essence
                      </button>
                    </div>
                  )}
                </>
              ) : craftMode === 'upgrade' && upgradeTarget ? (
                /* Upgrade mode: selecting a filled affix */
                <>
                  <h4>Upgrade: {getAffixShortName(upgradeTarget.affixId)} (T{upgradeTarget.tier})</h4>
                  <p className="bs-hint" style={{ fontSize: '11px', margin: '0 0 8px' }}>
                    Select a higher-tier essence to replace the current affix. The old affix will be consumed.
                  </p>
                  <EssenceViewer
                    essences={state.essences}
                    selectable
                    selectedId={selectedEssenceId}
                    onSelect={setSelectedEssenceId}
                    filterSlotType={upgradeTarget.slotType}
                    filterAffixId={upgradeTarget.affixId}
                    minTier={upgradeTarget.tier}
                  />

                  {selectedEssence && (
                    <div className="craft-confirmation">
                      <div className="craft-essence-preview" style={{ color: selectedEssence.slotType === 'prefix' ? '#ffcc44' : '#44ccff' }}>
                        {formatEssence(selectedEssence)}
                      </div>
                      <div className="craft-upgrade-arrow">
                        T{upgradeTarget.tier} &rarr; T{selectedEssence.tier}
                      </div>
                      <div className={`craft-cost ${canAfford ? '' : 'insufficient'}`}>
                        Cost: {upgradeCost.toLocaleString()}g
                        {!canAfford && <span className="cost-warning"> (not enough gold)</span>}
                      </div>
                      <button
                        className="btn-primary bs-slot-btn upgrade-btn"
                        disabled={!canAfford}
                        onClick={handleUpgradeEssence}
                      >
                        Upgrade Affix
                      </button>
                    </div>
                  )}
                </>
              ) : craftItem ? (
                <div className="bs-empty">Click an empty slot to add an essence, or click a filled affix to upgrade it.</div>
              ) : (
                <div className="bs-empty">
                  <div>Essences: {state.essences.length}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
