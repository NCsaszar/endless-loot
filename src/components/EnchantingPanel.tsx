import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { RARITY_ORDER, RARITY_COLORS, ALL_EQUIP_SLOTS, SLOT_LABELS } from '../types';
import { enchantCost } from '../data/formulas';
import ItemCard from './ItemCard';
import { SLOT_ICONS } from './icons';

export default function EnchantingPanel() {
  const { state, doEnchantItem } = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    state.inventory.find(i => i.id === selectedId)
    ?? Object.values(state.equipment).find(i => i?.id === selectedId)
    ?? null;

  const cost = selected ? enchantCost(selected.rarity) : null;
  const canAfford = cost
    ? state.materials.scrap >= cost.scrap && state.materials.fragments >= cost.fragments
    : false;
  const isMaxRarity = selected ? selected.rarity === 'legendary' : false;
  const nextRarity = selected && !isMaxRarity
    ? RARITY_ORDER[RARITY_ORDER.indexOf(selected.rarity) + 1]
    : null;

  const handleEnchant = () => {
    if (selectedId && doEnchantItem(selectedId)) {
      // keep selected to show result
    }
  };

  return (
    <div className="enchanting-panel">
      <h2>Enchanting</h2>

      <div className="enchant-materials">
        <span>Scrap: <strong>{state.materials.scrap}</strong></span>
        <span>Fragments: <strong>{state.materials.fragments}</strong></span>
        <span>Crystals: <strong>{state.materials.crystals}</strong></span>
        <span>Essences: <strong>{state.materials.essences}</strong></span>
        <span>Shards: <strong>{state.materials.legendaryShards}</strong></span>
      </div>

      {/* Equipped Items Section */}
      <div className="enchant-equipped-section">
        <h3>Equipped Items</h3>
        <div className="enchant-equipped-grid">
          {ALL_EQUIP_SLOTS.map(slot => {
            const eqItem = state.equipment[slot] ?? null;
            const slotCost = eqItem ? enchantCost(eqItem.rarity) : null;
            const slotCanAfford = slotCost
              ? state.materials.scrap >= slotCost.scrap && state.materials.fragments >= slotCost.fragments
              : false;
            const slotIsMax = eqItem ? eqItem.rarity === 'legendary' : false;

            return (
              <div
                key={slot}
                className={`enchant-equip-slot ${eqItem ? 'has-item' : ''} ${eqItem?.id === selectedId ? 'selected' : ''}`}
                style={eqItem ? { borderColor: RARITY_COLORS[eqItem.rarity] } : undefined}
                onClick={() => eqItem && setSelectedId(eqItem.id === selectedId ? null : eqItem.id)}
              >
                <div className="enchant-slot-label">{SLOT_LABELS[slot]}</div>
                {eqItem ? (
                  <>
                    <div className="enchant-slot-name" style={{ color: RARITY_COLORS[eqItem.rarity] }}>
                      {eqItem.name}
                    </div>
                    <div className="enchant-slot-level">Lv.{eqItem.itemLevel}</div>
                    {slotIsMax ? (
                      <div className="enchant-slot-max">MAX</div>
                    ) : slotCost ? (
                      <button
                        className="enchant-quick-btn"
                        disabled={!slotCanAfford}
                        onClick={(e) => {
                          e.stopPropagation();
                          doEnchantItem(eqItem.id);
                        }}
                      >
                        Enchant ({slotCost.scrap}s + {slotCost.fragments}f)
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="enchant-empty-slot">
                    {(() => { const Icon = SLOT_ICONS[slot]; return <Icon size={24} color="currentColor" className="equip-empty-icon" />; })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Items + Detail Panel */}
      <div className="enchant-layout">
        <div className="enchant-grid">
          <h3 className="enchant-inv-header">Inventory Items</h3>
          <div className="enchant-inv-grid">
            {state.inventory.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                grid
                selected={item.id === selectedId}
                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
              />
            ))}
            {state.inventory.length === 0 && <div className="inv-empty">No items in inventory</div>}
          </div>
        </div>

        {selected && (
          <div className="enchant-detail">
            <ItemCard item={selected} />

            {isMaxRarity ? (
              <div className="enchant-max-rarity">Maximum rarity reached</div>
            ) : (
              <>
                <div className="enchant-rarity-change">
                  <span style={{ color: RARITY_COLORS[selected.rarity] }}>{selected.rarity}</span>
                  <span className="enchant-arrow">&rarr;</span>
                  <span style={{ color: RARITY_COLORS[nextRarity!] }}>{nextRarity}</span>
                </div>

                {cost && (
                  <div className={`enchant-cost ${canAfford ? 'affordable' : 'unaffordable'}`}>
                    Cost: {cost.scrap} scrap + {cost.fragments} fragments
                  </div>
                )}

                <div className="enchant-preview">+1 bonus stat slot</div>

                <button
                  className="enchant-btn"
                  disabled={!canAfford}
                  onClick={handleEnchant}
                >
                  Enchant
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
