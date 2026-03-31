import { useState, useMemo } from 'react';
import type { Essence, AffixId } from '../types';
import { PREFIX_POOL, SUFFIX_POOL, getAffixShortName } from '../data/affixes';
import type { EssenceFilter } from '../systems/blacksmith';

interface EssenceDiscardModalProps {
  essences: Essence[];
  onDiscard: (filter: EssenceFilter) => void;
  onClose: () => void;
}

const ALL_AFFIX_IDS: AffixId[] = [
  ...PREFIX_POOL.map(a => a.id),
  ...SUFFIX_POOL.map(a => a.id),
];

export default function EssenceDiscardModal({ essences, onDiscard, onClose }: EssenceDiscardModalProps) {
  const [selectedAffixIds, setSelectedAffixIds] = useState<Set<AffixId>>(new Set());
  const [maxTier, setMaxTier] = useState<number>(1);

  // Only show affix types the player actually has
  const availableAffixIds = useMemo(() => {
    const ids = new Set<AffixId>();
    for (const e of essences) ids.add(e.affixId);
    return ALL_AFFIX_IDS.filter(id => ids.has(id));
  }, [essences]);

  const matchCount = useMemo(() => {
    return essences.filter(e => {
      const matchesAffix = selectedAffixIds.size === 0 || selectedAffixIds.has(e.affixId);
      const matchesTier = e.tier <= maxTier;
      return matchesAffix && matchesTier;
    }).length;
  }, [essences, selectedAffixIds, maxTier]);

  const toggleAffix = (id: AffixId) => {
    setSelectedAffixIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDiscard = () => {
    const filter: EssenceFilter = { maxTier };
    if (selectedAffixIds.size > 0) {
      filter.affixIds = Array.from(selectedAffixIds);
    }
    onDiscard(filter);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content discard-modal" onClick={e => e.stopPropagation()}>
        <h3>Discard Essences</h3>

        <div className="discard-section">
          <label>Max Tier (discard T1 through T{maxTier}):</label>
          <div className="discard-tier-selector">
            {[1, 2, 3, 4, 5].map(t => (
              <button
                key={t}
                className={`tier-btn ${maxTier >= t ? 'active' : ''}`}
                onClick={() => setMaxTier(t)}
              >
                T{t}
              </button>
            ))}
          </div>
        </div>

        <div className="discard-section">
          <label>Affix Types (none selected = all types):</label>
          <div className="discard-affix-grid">
            {availableAffixIds.map(id => (
              <button
                key={id}
                className={`affix-filter-btn ${selectedAffixIds.has(id) ? 'active' : ''}`}
                onClick={() => toggleAffix(id)}
              >
                {getAffixShortName(id)}
              </button>
            ))}
          </div>
        </div>

        <div className="discard-preview">
          {matchCount} essence{matchCount !== 1 ? 's' : ''} will be discarded
        </div>

        <div className="discard-actions">
          <button className="btn-danger" onClick={handleDiscard} disabled={matchCount === 0}>
            Discard ({matchCount})
          </button>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
