import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { RARITY_ORDER, RARITY_COLORS } from '../types';
import { enchantCost } from '../data/formulas';
import ItemCard from './ItemCard';

export default function EnchantingPanel() {
  const { state, doEnchantItem } = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = state.inventory.find(i => i.id === selectedId) ?? null;
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

      <div className="enchant-layout">
        <div className="enchant-grid">
          {state.inventory.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              grid
              selected={item.id === selectedId}
              onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
            />
          ))}
          {state.inventory.length === 0 && <div className="inv-empty">No items to enchant</div>}
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
