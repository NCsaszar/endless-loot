import type { ZoneDef, MobDef } from '../types';

// --- Mob Definitions ---

// Zone 1: Whispering Woods
const slime: MobDef = {
  id: 'slime',
  name: 'Slime',
  isBoss: false,
  baseHp: 20,
  baseAtk: 3,
  baseDef: 1,
  baseXp: 10,
  baseGold: 5,
};

const wolf: MobDef = {
  id: 'wolf',
  name: 'Wolf',
  isBoss: false,
  baseHp: 25,
  baseAtk: 5,
  baseDef: 2,
  baseXp: 12,
  baseGold: 6,
};

const goblin: MobDef = {
  id: 'goblin',
  name: 'Goblin',
  isBoss: false,
  baseHp: 30,
  baseAtk: 4,
  baseDef: 3,
  baseXp: 14,
  baseGold: 8,
};

const goblinChief: MobDef = {
  id: 'goblin_chief',
  name: 'Goblin Chief',
  isBoss: true,
  baseHp: 100,
  baseAtk: 8,
  baseDef: 5,
  baseXp: 50,
  baseGold: 30,
};

// Zone 2: Dusty Caverns
const bat: MobDef = {
  id: 'bat',
  name: 'Cave Bat',
  isBoss: false,
  baseHp: 35,
  baseAtk: 7,
  baseDef: 3,
  baseXp: 18,
  baseGold: 10,
};

const skeleton: MobDef = {
  id: 'skeleton',
  name: 'Skeleton',
  isBoss: false,
  baseHp: 45,
  baseAtk: 8,
  baseDef: 6,
  baseXp: 22,
  baseGold: 12,
};

const spider: MobDef = {
  id: 'spider',
  name: 'Giant Spider',
  isBoss: false,
  baseHp: 40,
  baseAtk: 10,
  baseDef: 4,
  baseXp: 20,
  baseGold: 11,
};

const caveTroll: MobDef = {
  id: 'cave_troll',
  name: 'Cave Troll',
  isBoss: true,
  baseHp: 200,
  baseAtk: 15,
  baseDef: 10,
  baseXp: 100,
  baseGold: 60,
};

// Zone 3: Ruined Fortress
const bandit: MobDef = {
  id: 'bandit',
  name: 'Bandit',
  isBoss: false,
  baseHp: 60,
  baseAtk: 12,
  baseDef: 8,
  baseXp: 30,
  baseGold: 16,
};

const darkKnight: MobDef = {
  id: 'dark_knight',
  name: 'Dark Knight',
  isBoss: false,
  baseHp: 80,
  baseAtk: 14,
  baseDef: 12,
  baseXp: 38,
  baseGold: 20,
};

const wraith: MobDef = {
  id: 'wraith',
  name: 'Wraith',
  isBoss: false,
  baseHp: 55,
  baseAtk: 18,
  baseDef: 5,
  baseXp: 35,
  baseGold: 18,
};

const fallenCommander: MobDef = {
  id: 'fallen_commander',
  name: 'Fallen Commander',
  isBoss: true,
  baseHp: 400,
  baseAtk: 22,
  baseDef: 18,
  baseXp: 200,
  baseGold: 120,
};

// --- Zone Definitions ---

export const ZONES: ZoneDef[] = [
  {
    id: 1,
    name: 'Whispering Woods',
    levelRange: [1, 3],
    mobs: [slime, wolf, goblin],
    boss: goblinChief,
    unlockCost: 0,
  },
  {
    id: 2,
    name: 'Dusty Caverns',
    levelRange: [4, 7],
    mobs: [bat, skeleton, spider],
    boss: caveTroll,
    unlockCost: 0, // unlocked by beating zone 1 boss
  },
  {
    id: 3,
    name: 'Ruined Fortress',
    levelRange: [8, 12],
    mobs: [bandit, darkKnight, wraith],
    boss: fallenCommander,
    unlockCost: 0,
  },
];

export function getZone(id: number): ZoneDef | undefined {
  return ZONES.find(z => z.id === id);
}
