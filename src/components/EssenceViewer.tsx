import { useState, useMemo } from 'react';
import type { Essence, AffixSlotType, AffixId } from '../types';
import { getAffixShortName } from '../data/affixes';

interface EssenceViewerProps {
  essences: Essence[];
  selectable?: boolean;
  selectedId?: string | null;
  onSelect?: (essenceId: string) => void;
  filterSlotType?: AffixSlotType;
  filterAffixId?: AffixId;
  minTier?: number;
}

interface EssenceGroup {
  affixId: AffixId;
  slotType: AffixSlotType;
  displayName: string;
  essences: Essence[];
  tierCounts: Map<number, number>;
}

export default function EssenceViewer({ essences, selectable, selectedId, onSelect, filterSlotType, filterAffixId, minTier }: EssenceViewerProps) {
  const [expandedGroup, setExpandedGroup] = useState<AffixId | null>(null);

  const groups = useMemo(() => {
    let filtered = essences;
    if (filterSlotType) {
      filtered = filtered.filter(e => e.slotType === filterSlotType);
    }
    if (filterAffixId) {
      filtered = filtered.filter(e => e.affixId === filterAffixId);
    }
    if (minTier !== undefined) {
      filtered = filtered.filter(e => e.tier > minTier);
    }

    const map = new Map<AffixId, EssenceGroup>();
    for (const e of filtered) {
      let group = map.get(e.affixId);
      if (!group) {
        group = {
          affixId: e.affixId,
          slotType: e.slotType,
          displayName: getAffixShortName(e.affixId),
          essences: [],
          tierCounts: new Map(),
        };
        map.set(e.affixId, group);
      }
      group.essences.push(e);
      group.tierCounts.set(e.tier, (group.tierCounts.get(e.tier) || 0) + 1);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.slotType !== b.slotType) return a.slotType === 'prefix' ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [essences, essences.length, filterSlotType, filterAffixId, minTier]);

  if (groups.length === 0) {
    return <div className="essence-viewer-empty">{minTier !== undefined ? 'No higher-tier essences available' : 'No essences'}</div>;
  }

  const formatTierCounts = (tierCounts: Map<number, number>) => {
    const entries: string[] = [];
    for (let t = 1; t <= 5; t++) {
      const count = tierCounts.get(t);
      if (count) entries.push(`T${t}\u00d7${count}`);
    }
    return entries.join(', ');
  };

  return (
    <div className="essence-viewer">
      {groups.map(group => (
        <div key={group.affixId} className="essence-group">
          <div
            className={`essence-group-header ${selectable ? 'clickable' : ''}`}
            onClick={() => {
              if (selectable) setExpandedGroup(expandedGroup === group.affixId ? null : group.affixId);
            }}
          >
            <span className="essence-group-name" style={{ color: group.slotType === 'prefix' ? '#ffcc44' : '#44ccff' }}>
              {group.displayName}
            </span>
            <span className="essence-group-count">
              ({group.essences.length}) {formatTierCounts(group.tierCounts)}
            </span>
            {selectable && (
              <span className="essence-expand-icon">{expandedGroup === group.affixId ? '\u25BC' : '\u25B6'}</span>
            )}
          </div>
          {selectable && expandedGroup === group.affixId && (
            <div className="essence-group-items">
              {[...group.essences]
                .sort((a, b) => b.tier - a.tier || b.value - a.value)
                .map(e => (
                  <div
                    key={e.id}
                    className={`essence-item ${selectedId === e.id ? 'selected' : ''}`}
                    onClick={() => onSelect?.(e.id)}
                  >
                    <span className="essence-tier">T{e.tier}</span>
                    <span className="essence-value">+{(e.value * 100).toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
