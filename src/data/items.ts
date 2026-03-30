import type { EquipSlot } from '../types';

// --- Base Item Definitions ---
// Each slot has named item types that scale with item level

export interface BaseItemDef {
  name: string;
  slot: EquipSlot;
  basePrimaryStat: number; // base value at item level 1
}

export const BASE_ITEMS: BaseItemDef[] = [
  // Weapons
  { name: 'Rusty Sword', slot: 'weapon', basePrimaryStat: 5 },
  { name: 'Iron Sword', slot: 'weapon', basePrimaryStat: 7 },
  { name: 'Battle Axe', slot: 'weapon', basePrimaryStat: 9 },
  { name: 'War Hammer', slot: 'weapon', basePrimaryStat: 8 },
  { name: 'Enchanted Staff', slot: 'weapon', basePrimaryStat: 6 },

  // Offhand
  { name: 'Wooden Shield', slot: 'offhand', basePrimaryStat: 3 },
  { name: 'Iron Buckler', slot: 'offhand', basePrimaryStat: 5 },
  { name: 'Tower Shield', slot: 'offhand', basePrimaryStat: 7 },

  // Helmet
  { name: 'Leather Cap', slot: 'helmet', basePrimaryStat: 2 },
  { name: 'Iron Helm', slot: 'helmet', basePrimaryStat: 4 },
  { name: 'Plate Helmet', slot: 'helmet', basePrimaryStat: 6 },

  // Chest
  { name: 'Cloth Tunic', slot: 'chest', basePrimaryStat: 3 },
  { name: 'Leather Armor', slot: 'chest', basePrimaryStat: 5 },
  { name: 'Chain Mail', slot: 'chest', basePrimaryStat: 8 },
  { name: 'Plate Armor', slot: 'chest', basePrimaryStat: 10 },

  // Legs
  { name: 'Cloth Pants', slot: 'legs', basePrimaryStat: 2 },
  { name: 'Leather Leggings', slot: 'legs', basePrimaryStat: 4 },
  { name: 'Chain Greaves', slot: 'legs', basePrimaryStat: 6 },

  // Boots
  { name: 'Sandals', slot: 'boots', basePrimaryStat: 1 },
  { name: 'Leather Boots', slot: 'boots', basePrimaryStat: 3 },
  { name: 'Iron Greaves', slot: 'boots', basePrimaryStat: 5 },

  // Ring
  { name: 'Copper Ring', slot: 'ring', basePrimaryStat: 2 },
  { name: 'Silver Ring', slot: 'ring', basePrimaryStat: 4 },
  { name: 'Gold Ring', slot: 'ring', basePrimaryStat: 6 },

  // Amulet
  { name: 'Bone Pendant', slot: 'amulet', basePrimaryStat: 2 },
  { name: 'Silver Amulet', slot: 'amulet', basePrimaryStat: 4 },
  { name: 'Crystal Necklace', slot: 'amulet', basePrimaryStat: 6 },
];

export function getBaseItemsForSlot(slot: EquipSlot): BaseItemDef[] {
  return BASE_ITEMS.filter(item => item.slot === slot);
}
