import type { GameState, Essence, AffixId, AffixSlotType, Item } from '../types';

// --- Constants ---

const DISMANTLE_CHANCE = 0.6; // 60% chance per affix to become an essence
const SLOT_BASE_COST = 50;    // gold cost = base × tier

// --- Slotting Cost ---

export function getSlottingCost(tier: number): number {
  return SLOT_BASE_COST * tier;
}

// --- Get Empty Slots on an Item ---

export function getEmptySlots(item: Item): { type: AffixSlotType; index: number }[] {
  const slots: { type: AffixSlotType; index: number }[] = [];
  for (let i = 0; i < item.prefixes.length; i++) {
    if (item.prefixes[i] === null) slots.push({ type: 'prefix', index: i });
  }
  for (let i = 0; i < item.suffixes.length; i++) {
    if (item.suffixes[i] === null) slots.push({ type: 'suffix', index: i });
  }
  return slots;
}

// --- Dismantle Item → Extract Essences ---

export function dismantleItem(state: GameState, itemId: string): Essence[] {
  const itemIndex = state.inventory.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return [];

  const item = state.inventory[itemIndex];
  if (item.locked || item.consumable) return [];

  const extracted: Essence[] = [];

  // Collect all non-null affixes and roll extraction chance
  const allAffixes = [
    ...item.prefixes.filter(a => a !== null),
    ...item.suffixes.filter(a => a !== null),
  ];

  for (const affix of allAffixes) {
    if (Math.random() < DISMANTLE_CHANCE) {
      extracted.push({
        id: crypto.randomUUID(),
        affixId: affix.id,
        slotType: affix.slotType,
        tier: affix.tier,
        value: affix.value,
      });
    }
  }

  // Add essences to state
  state.essences.push(...extracted);

  // Remove item from inventory
  state.inventory.splice(itemIndex, 1);

  return extracted;
}

// --- Slot Essence into Item ---

export function slotEssence(
  state: GameState,
  itemId: string,
  essenceId: string,
  slotIndex: number,
): boolean {
  // Find the item in inventory or equipment
  let item: Item | undefined = state.inventory.find(i => i.id === itemId);
  if (!item) {
    for (const equipped of Object.values(state.equipment)) {
      if (equipped && equipped.id === itemId) {
        item = equipped;
        break;
      }
    }
  }
  if (!item) return false;

  // Find the essence
  const essenceIndex = state.essences.findIndex(e => e.id === essenceId);
  if (essenceIndex === -1) return false;
  const essence = state.essences[essenceIndex];

  // Validate slot index
  if (slotIndex < 0 || slotIndex > 2) return false;

  // Determine target slot array
  const slots = essence.slotType === 'prefix' ? item.prefixes : item.suffixes;

  // Validate slot is empty
  if (slots[slotIndex] !== null) return false;

  // Check no duplicate affix ID on this item
  const allExisting = [...item.prefixes, ...item.suffixes].filter(a => a !== null);
  if (allExisting.some(a => a.id === essence.affixId)) return false;

  // Check gold cost
  const cost = getSlottingCost(essence.tier);
  if (state.gold < cost) return false;

  // Deduct gold
  state.gold -= cost;

  // Slot the affix
  slots[slotIndex] = {
    id: essence.affixId,
    slotType: essence.slotType,
    tier: essence.tier,
    value: essence.value,
  };

  // Remove essence from storage
  state.essences.splice(essenceIndex, 1);

  return true;
}

// --- Discard Essences by Filter ---

export interface EssenceFilter {
  affixIds?: AffixId[];
  maxTier?: number;
}

export function discardEssences(state: GameState, filter: EssenceFilter): number {
  const before = state.essences.length;

  state.essences = state.essences.filter(e => {
    let matches = true;
    if (filter.affixIds && filter.affixIds.length > 0) {
      matches = matches && filter.affixIds.includes(e.affixId);
    }
    if (filter.maxTier !== undefined) {
      matches = matches && e.tier <= filter.maxTier;
    }
    // Keep essences that do NOT match the filter
    return !matches;
  });

  return before - state.essences.length;
}
