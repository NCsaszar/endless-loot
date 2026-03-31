import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import type { Item, Affix, AffixSlotType, Essence } from '../types';
import { RARITY_COLORS } from '../types';
import { formatAffix, getAffixShortName } from '../data/affixes';
import { getEmptySlots, getSlottingCost } from '../systems/blacksmith';
import ItemCard from './ItemCard';
import EssenceViewer from './EssenceViewer';

type BlacksmithTab = 'dismantle' | 'craft';

function formatEssence(e: Essence): string {
  return `[T${e.tier}] +${(e.value * 100).toFixed(1)}% ${getAffixShortName(e.affixId)}`;
}

export default function BlacksmithPanel() {
  const { state, doDismantleItem, doSlotEssence } = useGameState();

  const [activeTab, setActiveTab] = useState<BlacksmithTab>('dismantle');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dismantleResult, setDismantleResult] = useState<Essence[] | null>(null);

  // Craft tab state
  const [craftItemId, setCraftItemId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ type: AffixSlotType; index: number } | null>(null);
  const [selectedEssenceId, setSelectedEssenceId] = useState<string | null>(null);
  const [craftSource, setCraftSource] = useState<'inventory' | 'equipped'>('inventory');

  // --- Dismantle Tab ---

  const dismantleItems = useMemo(() => {
    return state.inventory.filter(item => {
      const hasAffixes = item.prefixes.some(a => a !== null) || item.suffixes.some(a => a !== null);
      return hasAffixes;
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

  const craftItems = useMemo(() => {
    if (craftSource === 'inventory') {
      return state.inventory.filter(item => getEmptySlots(item).length > 0);
    }
    return Object.values(state.equipment).filter((item): item is Item =>
      item !== undefined && getEmptySlots(item).length > 0
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftSource, state.inventory, state.inventory.length, state.equipment]);

  const craftItem = craftItems.find(i => i.id === craftItemId) ?? null;

  const selectedEssence = selectedEssenceId
    ? state.essences.find(e => e.id === selectedEssenceId) ?? null
    : null;

  const slottingCost = selectedEssence ? getSlottingCost(selectedEssence.tier) : 0;
  const canAfford = state.gold >= slottingCost;

  // Check for duplicate affix on the target item
  const hasDuplicateAffix = useMemo(() => {
    if (!craftItem || !selectedEssence) return false;
    const allExisting = [...craftItem.prefixes, ...craftItem.suffixes].filter((a): a is Affix => a !== null);
    return allExisting.some(a => a.id === selectedEssence.affixId);
  }, [craftItem, selectedEssence]);

  const handleSlotEssence = () => {
    if (!craftItemId || !selectedEssenceId || !selectedSlot) return;
    const success = doSlotEssence(craftItemId, selectedEssenceId, selectedSlot.index);
    if (success) {
      setSelectedEssenceId(null);
      setSelectedSlot(null);
      // If the item no longer has empty slots, deselect it
      const updated = [...state.inventory, ...Object.values(state.equipment).filter(Boolean) as Item[]]
        .find(i => i.id === craftItemId);
      if (updated && getEmptySlots(updated).length === 0) {
        setCraftItemId(null);
      }
    }
  };

  return (
    <div className="blacksmith-panel">
      <h2>Blacksmith</h2>

      <div className="blacksmith-tabs">
        <button
          className={`bs-tab ${activeTab === 'dismantle' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dismantle'); setCraftItemId(null); setSelectedSlot(null); setSelectedEssenceId(null); }}
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
          <p className="bs-hint">Select an item to extract its affixes as essences. Each affix has a 60% chance to be extracted.</p>

          {dismantleItems.length === 0 ? (
            <div className="bs-empty">No items with affixes to dismantle.</div>
          ) : (
            <div className="bs-item-grid">
              {dismantleItems.map(item => (
                <div key={item.id} className="inv-slot filled">
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
              {selectedDismantleItem.locked ? (
                <div className="bs-locked-warning">Item is locked. Unlock it first.</div>
              ) : (
                <button className="btn-danger bs-dismantle-btn" onClick={handleDismantle}>
                  Dismantle
                </button>
              )}
            </div>
          )}

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
        </div>
      )}

      {activeTab === 'craft' && (
        <div className="craft-section">
          <p className="bs-hint">Select an item with empty affix slots, then choose an essence to slot in.</p>

          <div className="craft-layout">
            <div className="craft-left">
              <div className="craft-source-toggle">
                <button
                  className={craftSource === 'inventory' ? 'active' : ''}
                  onClick={() => { setCraftSource('inventory'); setCraftItemId(null); setSelectedSlot(null); setSelectedEssenceId(null); }}
                >
                  Inventory
                </button>
                <button
                  className={craftSource === 'equipped' ? 'active' : ''}
                  onClick={() => { setCraftSource('equipped'); setCraftItemId(null); setSelectedSlot(null); setSelectedEssenceId(null); }}
                >
                  Equipped
                </button>
              </div>

              {craftItems.length === 0 ? (
                <div className="bs-empty">No items with empty affix slots.</div>
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
                          setSelectedSlot(null);
                          setSelectedEssenceId(null);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {craftItem && (
                <div className="craft-item-slots">
                  <h4 style={{ color: RARITY_COLORS[craftItem.rarity] }}>{craftItem.name}</h4>
                  <div className="craft-slots-grid">
                    <div className="craft-slot-column">
                      <span className="craft-slot-label">Prefixes</span>
                      {craftItem.prefixes.map((affix, idx) => (
                        <div
                          key={`p${idx}`}
                          className={`craft-slot ${affix === null ? 'available' : 'filled'} ${
                            selectedSlot?.type === 'prefix' && selectedSlot.index === idx ? 'selected' : ''
                          }`}
                          onClick={() => {
                            if (affix === null) {
                              setSelectedSlot({ type: 'prefix', index: idx });
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
                          className={`craft-slot ${affix === null ? 'available' : 'filled'} ${
                            selectedSlot?.type === 'suffix' && selectedSlot.index === idx ? 'selected' : ''
                          }`}
                          onClick={() => {
                            if (affix === null) {
                              setSelectedSlot({ type: 'suffix', index: idx });
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
              {selectedSlot ? (
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
                        <div className="craft-warning">Item already has this affix type!</div>
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
              ) : craftItem ? (
                <div className="bs-empty">Click an empty slot on the left to select it.</div>
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
