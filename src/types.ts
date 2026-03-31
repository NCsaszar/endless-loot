// ============================================================
// Endless Loot — Core Type Definitions
// ============================================================

// --- Primary Stats (player-allocated) ---

export interface PrimaryStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
  luk: number;
}

export type PrimaryStat = keyof PrimaryStats;

// --- Derived Stats (calculated from primary + gear) ---

export interface DerivedStats {
  attackPower: number;
  attackSpeed: number; // attacks per second
  critChance: number; // 0-1
  critDamage: number; // multiplier, e.g., 1.5 = 150%
  maxHp: number;
  defense: number;
  dodgeChance: number; // 0-1
  hpRegen: number; // HP per second
  goldFind: number; // multiplier, base 1.0
  xpGainBonus: number; // multiplier, base 1.0
  lootRarityBonus: number; // additive bonus to rarity weights
}

// --- Rarity ---

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export type BulkActionMode = 'sell' | 'salvage';

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#CCCCCC',
  uncommon: '#00CC00',
  rare: '#4444FF',
  epic: '#AA00FF',
  legendary: '#FF8800',
};

// --- Equipment Slots ---

export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'helmet'
  | 'chest'
  | 'legs'
  | 'boots'
  | 'ring'
  | 'amulet';

export const ALL_EQUIP_SLOTS: EquipSlot[] = [
  'weapon', 'offhand', 'helmet', 'chest', 'legs', 'boots', 'ring', 'amulet',
];

export const SLOT_LABELS: Record<EquipSlot, string> = {
  weapon: 'Weapon',
  offhand: 'Offhand',
  helmet: 'Helmet',
  chest: 'Chest',
  legs: 'Legs',
  boots: 'Boots',
  ring: 'Ring',
  amulet: 'Amulet',
};

// --- Bonus Stat Types (DEPRECATED — kept for save migration only) ---

export type BonusStatType =
  | 'str' | 'dex' | 'int' | 'vit' | 'luk'
  | 'critChance' | 'dodgeChance' | 'hp' | 'defense';

export interface BonusStat {
  type: BonusStatType;
  value: number;
}

// --- Affix System ---

export type PrefixAffixId = 'attackPower' | 'attackSpeed' | 'critChance' | 'critDamage';
export type SuffixAffixId = 'str' | 'dex' | 'int' | 'vit' | 'luk' | 'maxLife' | 'defense' | 'dodgeChance' | 'goldFind' | 'xpGain' | 'hpRegen' | 'lootRarity';
export type AffixId = PrefixAffixId | SuffixAffixId;
export type AffixSlotType = 'prefix' | 'suffix';

export interface Affix {
  id: AffixId;
  slotType: AffixSlotType;
  tier: number;   // T1-T5 (1=weakest, 5=strongest)
  value: number;  // percentage as decimal, e.g. 0.10 = 10%
}

// --- Essences (extracted affixes for crafting) ---

export interface Essence {
  id: string;              // unique ID
  affixId: AffixId;
  slotType: AffixSlotType;
  tier: number;            // T1-T5
  value: number;           // preserved decimal % from original affix
}

// --- Items ---

export interface Item {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  itemLevel: number;
  primaryStatValue: number; // main stat for the slot (e.g., ATK for weapon, DEF for armor)
  randomPrimaryStat: PrimaryStat; // 1 random flat primary stat
  randomPrimaryStatValue: number; // flat value of the random primary stat
  prefixes: (Affix | null)[]; // length 3, null = empty slot
  suffixes: (Affix | null)[]; // length 3, null = empty slot
  bonusStats?: BonusStat[]; // DEPRECATED — kept for save migration only
  sellValue: number;
  salvageResult: { material: MaterialType; amount: number };
  locked: boolean;
}

// --- Materials (for future crafting) ---

export type MaterialType = 'scrap' | 'fragments' | 'crystals' | 'essences' | 'legendaryShards';

export type Materials = Record<MaterialType, number>;

// --- Equipment (what's currently worn) ---

export type Equipment = Partial<Record<EquipSlot, Item>>;

// --- Mob ---

export interface MobDef {
  id: string;
  name: string;
  isBoss: boolean;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseXp: number;
  baseGold: number;
  portrait?: string;
}

export interface MobInstance {
  def: MobDef;
  level: number;
  maxHp: number;
  currentHp: number;
  atk: number;
  defense: number;
  xpReward: number;
  goldReward: number;
  attackSpeed: number; // attacks per second
}

// --- Zone ---

export interface ZoneDef {
  id: number;
  name: string;
  levelRange: [number, number];
  mobs: MobDef[];
  boss: MobDef;
  unlockCost: number; // gold cost to unlock (0 for zone 1)
  rarityBonus: number; // multiplier boost to uncommon+ drop weights (0 = baseline)
  zoneItems?: string[]; // optional zone-exclusive item IDs (for future use)
}

// --- Damage Popup ---

export interface DamagePopup {
  id: number;
  amount: number;
  isCrit: boolean;
  target: 'mob' | 'player';
  type: 'damage' | 'dodge' | 'heal';
  timestamp: number;
}

// --- DPS Tracking ---

export interface DamageEntry {
  timestamp: number;
  amount: number;
}

// --- Combat State ---

export interface CombatState {
  currentMob: MobInstance | null;
  playerAttackProgress: number; // 0 to 1
  mobAttackProgress: number; // 0 to 1
  killCount: number;
  isPlayerDead: boolean;
  damagePopups: DamagePopup[];
  playerDamageLog: DamageEntry[];
  mobDamageLog: DamageEntry[];
}

// --- Combat Log Entry ---

export interface CombatLogEntry {
  id: number;
  timestamp: number;
  message: string;
  type: 'damage' | 'playerDamage' | 'kill' | 'loot' | 'death' | 'levelUp' | 'info';
}

// --- Character ---

export interface Character {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  unspentStatPoints: number;
  baseStats: PrimaryStats; // from level-up allocation
  trainingStats: PrimaryStats; // from gold training
  currentHp: number;
}

// --- Training ---

export interface TrainingLevels {
  str: number;
  dex: number;
  int: number;
  vit: number;
  luk: number;
}

// --- Game State ---

export interface GameState {
  character: Character;
  trainingLevels: TrainingLevels;
  equipment: Equipment;
  inventory: Item[];
  gold: number;
  materials: Materials;
  essences: Essence[];
  currentZoneId: number;
  unlockedZoneIds: number[];
  bossesDefeated: number[]; // zone IDs where boss has been killed
  combat: CombatState;
  combatLog: CombatLogEntry[];
  totalKills: number;
  totalGoldEarned: number;
  lastSaveTimestamp: number;
  saveVersion: number;
  autoSellRarities: Rarity[];
  autoSalvageRarities: Rarity[];
  combatActive: boolean;
}

// --- UI State (not persisted) ---

export type ActivePanel = 'character' | 'inventory' | 'training' | 'zones' | 'blacksmith';
