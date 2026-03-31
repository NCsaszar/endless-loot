import type { ZoneDef, MobDef } from '../types';

// --- Act Multiplier (50% power jump per act boundary, compounding) ---

function actMultiplier(act: number): number {
  return Math.pow(1.5, act - 1);
}

// --- Mob Generation Helper ---

function makeMob(id: string, name: string, isBoss: boolean, zoneId: number): MobDef {
  const act = Math.ceil(zoneId / 10);
  const midLevel = (zoneId - 1) * 3 + 2;
  const actMult = actMultiplier(act);
  const hpMult = isBoss ? 3.5 : 1;
  const atkMult = isBoss ? 2.0 : 1;
  const defMult = isBoss ? 2.5 : 1;
  const xpMult = isBoss ? 3.0 : 1;
  const goldMult = isBoss ? 4.0 : 1;
  return {
    id,
    name,
    isBoss,
    baseHp: Math.floor((15 + midLevel * 2.5) * hpMult * actMult),
    baseAtk: Math.floor((4 + midLevel * 1.2) * atkMult * actMult),
    baseDef: Math.floor((1 + midLevel * 0.5) * defMult * actMult),
    baseXp: Math.floor((8 + midLevel * 1.5) * xpMult * actMult),
    baseGold: Math.floor((4 + midLevel * 0.8) * goldMult * actMult),
  };
}

function zoneLevel(zoneId: number): [number, number] {
  return [(zoneId - 1) * 3 + 1, zoneId * 3];
}

function zoneRarityBonus(zoneId: number): number {
  const act = Math.ceil(zoneId / 10);
  const zoneInAct = (zoneId - 1) % 10; // 0-9

  // Discrete base rarity per act (indexed 1-5)
  const actBase = [0, 0.0, 0.15, 0.35, 0.60, 0.90];

  // Gradual within-act ramp
  const withinActRamp = 0.012 * zoneInAct;

  // Transition smoothing: first 3 zones of new act ramp in gradually
  let transitionFactor = 1.0;
  if (act > 1 && zoneInAct < 3) {
    transitionFactor = 0.5 + 0.5 * (zoneInAct / 2);
  }

  return parseFloat((actBase[act] * transitionFactor + withinActRamp).toFixed(3));
}

// --- Zone 1-3: Original Mob Definitions (preserved) ---

const slime: MobDef = {
  id: 'slime', name: 'Slime', isBoss: false,
  baseHp: 20, baseAtk: 5, baseDef: 1, baseXp: 10, baseGold: 5,
  portrait: '/portraits/slime.svg',
};
const wolf: MobDef = {
  id: 'wolf', name: 'Wolf', isBoss: false,
  baseHp: 25, baseAtk: 7, baseDef: 2, baseXp: 12, baseGold: 6,
  portrait: '/portraits/wolf.svg',
};
const goblin: MobDef = {
  id: 'goblin', name: 'Goblin', isBoss: false,
  baseHp: 30, baseAtk: 6, baseDef: 3, baseXp: 14, baseGold: 8,
  portrait: '/portraits/goblin.svg',
};
const goblinChief: MobDef = {
  id: 'goblin_chief', name: 'Goblin Chief', isBoss: true,
  baseHp: 100, baseAtk: 12, baseDef: 5, baseXp: 50, baseGold: 30,
  portrait: '/portraits/goblin_chief.svg',
};
const bat: MobDef = {
  id: 'bat', name: 'Cave Bat', isBoss: false,
  baseHp: 35, baseAtk: 9, baseDef: 3, baseXp: 18, baseGold: 10,
  portrait: '/portraits/bat.svg',
};
const skeleton: MobDef = {
  id: 'skeleton', name: 'Skeleton', isBoss: false,
  baseHp: 45, baseAtk: 11, baseDef: 6, baseXp: 22, baseGold: 12,
  portrait: '/portraits/skeleton.svg',
};
const spider: MobDef = {
  id: 'spider', name: 'Giant Spider', isBoss: false,
  baseHp: 40, baseAtk: 13, baseDef: 4, baseXp: 20, baseGold: 11,
  portrait: '/portraits/spider.svg',
};
const caveTroll: MobDef = {
  id: 'cave_troll', name: 'Cave Troll', isBoss: true,
  baseHp: 200, baseAtk: 20, baseDef: 10, baseXp: 100, baseGold: 60,
  portrait: '/portraits/cave_troll.svg',
};
const bandit: MobDef = {
  id: 'bandit', name: 'Bandit', isBoss: false,
  baseHp: 60, baseAtk: 16, baseDef: 8, baseXp: 30, baseGold: 16,
  portrait: '/portraits/bandit.svg',
};
const darkKnight: MobDef = {
  id: 'dark_knight', name: 'Dark Knight', isBoss: false,
  baseHp: 80, baseAtk: 18, baseDef: 12, baseXp: 38, baseGold: 20,
  portrait: '/portraits/dark_knight.svg',
};
const wraith: MobDef = {
  id: 'wraith', name: 'Wraith', isBoss: false,
  baseHp: 55, baseAtk: 22, baseDef: 5, baseXp: 35, baseGold: 18,
  portrait: '/portraits/wraith.svg',
};
const fallenCommander: MobDef = {
  id: 'fallen_commander', name: 'Fallen Commander', isBoss: true,
  baseHp: 400, baseAtk: 30, baseDef: 18, baseXp: 200, baseGold: 120,
  portrait: '/portraits/fallen_commander.svg',
};

// ============================================================
// Act Names (for UI display)
// ============================================================

export const ACT_NAMES: Record<number, string> = {
  1: 'The Verdant Wilds',
  2: 'The Sunken Depths',
  3: 'The Scorched Expanse',
  4: 'The Frozen Peaks',
  5: 'The Demonic Wastes',
};

export const ACT_THEMES: Record<number, {
  gradient: string;
  borderColor: string;
  glowColor: string;
  accentColor: string;
}> = {
  1: {
    gradient: 'linear-gradient(135deg, #0d1f0d 0%, #1a2a1a 50%, #0d1f0d 100%)',
    borderColor: '#2d5a2d',
    glowColor: 'rgba(45, 90, 45, 0.4)',
    accentColor: '#3a7a3a',
  },
  2: {
    gradient: 'linear-gradient(135deg, #0d1520 0%, #142838 50%, #0d1520 100%)',
    borderColor: '#2d4a6a',
    glowColor: 'rgba(45, 74, 106, 0.4)',
    accentColor: '#3a6a9a',
  },
  3: {
    gradient: 'linear-gradient(135deg, #201008 0%, #3a1a0a 50%, #201008 100%)',
    borderColor: '#6a3a1a',
    glowColor: 'rgba(106, 58, 26, 0.4)',
    accentColor: '#aa5522',
  },
  4: {
    gradient: 'linear-gradient(135deg, #121828 0%, #1a2844 50%, #121828 100%)',
    borderColor: '#4a6088',
    glowColor: 'rgba(74, 96, 136, 0.4)',
    accentColor: '#6a88bb',
  },
  5: {
    gradient: 'linear-gradient(135deg, #1a0a1a 0%, #2a1028 50%, #1a0a1a 100%)',
    borderColor: '#6a2a5a',
    glowColor: 'rgba(106, 42, 90, 0.4)',
    accentColor: '#aa44aa',
  },
};

// ============================================================
// Zone Definitions — 50 Zones across 5 Acts
// ============================================================

export const ZONES: ZoneDef[] = [
  // ========== ACT 1: THE VERDANT WILDS (Zones 1-10) ==========
  {
    id: 1, act: 1, name: 'Whispering Woods', levelRange: [1, 3],
    mobs: [slime, wolf, goblin], boss: goblinChief,
    unlockCost: 0, rarityBonus: 0,
  },
  {
    id: 2, act: 1, name: 'Dusty Caverns', levelRange: zoneLevel(2),
    mobs: [bat, skeleton, spider], boss: caveTroll,
    unlockCost: 0, rarityBonus: zoneRarityBonus(2),
  },
  {
    id: 3, act: 1, name: 'Ruined Fortress', levelRange: zoneLevel(3),
    mobs: [bandit, darkKnight, wraith], boss: fallenCommander,
    unlockCost: 0, rarityBonus: zoneRarityBonus(3),
  },
  {
    id: 4, act: 1, name: 'Mossy Hollow', levelRange: zoneLevel(4),
    mobs: [
      makeMob('boar', 'Boar', false, 4),
      makeMob('forest_spider', 'Forest Spider', false, 4),
      makeMob('mushroom_crawler', 'Mushroom Crawler', false, 4),
    ],
    boss: makeMob('ancient_treant', 'Ancient Treant', true, 4),
    unlockCost: 0, rarityBonus: zoneRarityBonus(4),
  },
  {
    id: 5, act: 1, name: 'Bramble Thicket', levelRange: zoneLevel(5),
    mobs: [
      makeMob('thorn_sprite', 'Thorn Sprite', false, 5),
      makeMob('feral_bear', 'Feral Bear', false, 5),
      makeMob('vine_stalker', 'Vine Stalker', false, 5),
    ],
    boss: makeMob('bramble_queen', 'Bramble Queen', true, 5),
    unlockCost: 0, rarityBonus: zoneRarityBonus(5),
  },
  {
    id: 6, act: 1, name: 'Sunken Marsh', levelRange: zoneLevel(6),
    mobs: [
      makeMob('marsh_toad', 'Marsh Toad', false, 6),
      makeMob('bog_lurker', 'Bog Lurker', false, 6),
      makeMob('swamp_leech', 'Swamp Leech', false, 6),
    ],
    boss: makeMob('hydra_hatchling', 'Hydra Hatchling', true, 6),
    unlockCost: 0, rarityBonus: zoneRarityBonus(6),
  },
  {
    id: 7, act: 1, name: 'Wildflower Meadow', levelRange: zoneLevel(7),
    mobs: [
      makeMob('wild_stallion', 'Wild Stallion', false, 7),
      makeMob('giant_bee', 'Giant Bee', false, 7),
      makeMob('harpy_scout', 'Harpy Scout', false, 7),
    ],
    boss: makeMob('wind_dancer', 'Wind Dancer', true, 7),
    unlockCost: 0, rarityBonus: zoneRarityBonus(7),
  },
  {
    id: 8, act: 1, name: 'Thornwood Pass', levelRange: zoneLevel(8),
    mobs: [
      makeMob('dire_wolf', 'Dire Wolf', false, 8),
      makeMob('treant_sprout', 'Treant Sprout', false, 8),
      makeMob('goblin_shaman', 'Goblin Shaman', false, 8),
    ],
    boss: makeMob('thornwood_guardian', 'Thornwood Guardian', true, 8),
    unlockCost: 0, rarityBonus: zoneRarityBonus(8),
  },
  {
    id: 9, act: 1, name: 'Ancient Grove', levelRange: zoneLevel(9),
    mobs: [
      makeMob('dryad', 'Dryad', false, 9),
      makeMob('moss_golem', 'Moss Golem', false, 9),
      makeMob('timber_serpent', 'Timber Serpent', false, 9),
    ],
    boss: makeMob('elder_oakwalker', 'Elder Oakwalker', true, 9),
    unlockCost: 0, rarityBonus: zoneRarityBonus(9),
  },
  {
    id: 10, act: 1, name: 'Verdant Summit', levelRange: zoneLevel(10),
    mobs: [
      makeMob('gryphon_fledgling', 'Gryphon Fledgling', false, 10),
      makeMob('mountain_lion', 'Mountain Lion', false, 10),
      makeMob('storm_eagle', 'Storm Eagle', false, 10),
    ],
    boss: makeMob('warden_of_wilds', 'Warden of the Wilds', true, 10),
    unlockCost: 0, rarityBonus: zoneRarityBonus(10),
  },

  // ========== ACT 2: THE SUNKEN DEPTHS (Zones 11-20) ==========
  {
    id: 11, act: 2, name: 'Crystal Tunnels', levelRange: zoneLevel(11),
    mobs: [
      makeMob('crystal_beetle', 'Crystal Beetle', false, 11),
      makeMob('rock_crawler', 'Rock Crawler', false, 11),
      makeMob('cave_lurker', 'Cave Lurker', false, 11),
    ],
    boss: makeMob('crystal_colossus', 'Crystal Colossus', true, 11),
    unlockCost: 0, rarityBonus: zoneRarityBonus(11),
  },
  {
    id: 12, act: 2, name: 'Forgotten Mine', levelRange: zoneLevel(12),
    mobs: [
      makeMob('undead_miner', 'Undead Miner', false, 12),
      makeMob('mine_rat', 'Mine Rat', false, 12),
      makeMob('dynamite_goblin', 'Dynamite Goblin', false, 12),
    ],
    boss: makeMob('the_foreman', 'The Foreman', true, 12),
    unlockCost: 0, rarityBonus: zoneRarityBonus(12),
  },
  {
    id: 13, act: 2, name: 'Underground River', levelRange: zoneLevel(13),
    mobs: [
      makeMob('blind_piranha', 'Blind Piranha', false, 13),
      makeMob('river_stalker', 'River Stalker', false, 13),
      makeMob('cave_newt', 'Cave Newt', false, 13),
    ],
    boss: makeMob('depth_serpent', 'Depth Serpent', true, 13),
    unlockCost: 0, rarityBonus: zoneRarityBonus(13),
  },
  {
    id: 14, act: 2, name: 'Fungal Cavern', levelRange: zoneLevel(14),
    mobs: [
      makeMob('spore_zombie', 'Spore Zombie', false, 14),
      makeMob('toxic_shroom', 'Toxic Shroom', false, 14),
      makeMob('mycelium_crawler', 'Mycelium Crawler', false, 14),
    ],
    boss: makeMob('fungal_tyrant', 'Fungal Tyrant', true, 14),
    unlockCost: 0, rarityBonus: zoneRarityBonus(14),
  },
  {
    id: 15, act: 2, name: 'Obsidian Halls', levelRange: zoneLevel(15),
    mobs: [
      makeMob('shadow_bat', 'Shadow Bat', false, 15),
      makeMob('obsidian_golem', 'Obsidian Golem', false, 15),
      makeMob('dark_elf_scout', 'Dark Elf Scout', false, 15),
    ],
    boss: makeMob('shadow_warden', 'Shadow Warden', true, 15),
    unlockCost: 0, rarityBonus: zoneRarityBonus(15),
  },
  {
    id: 16, act: 2, name: 'Echoing Abyss', levelRange: zoneLevel(16),
    mobs: [
      makeMob('echo_wraith', 'Echo Wraith', false, 16),
      makeMob('abyss_crawler', 'Abyss Crawler', false, 16),
      makeMob('stalactite_horror', 'Stalactite Horror', false, 16),
    ],
    boss: makeMob('voice_of_deep', 'Voice of the Deep', true, 16),
    unlockCost: 0, rarityBonus: zoneRarityBonus(16),
  },
  {
    id: 17, act: 2, name: 'Dwarven Ruins', levelRange: zoneLevel(17),
    mobs: [
      makeMob('animated_armor', 'Animated Armor', false, 17),
      makeMob('stone_guardian', 'Stone Guardian', false, 17),
      makeMob('rune_trap', 'Rune Trap', false, 17),
    ],
    boss: makeMob('runic_sentinel', 'Runic Sentinel', true, 17),
    unlockCost: 0, rarityBonus: zoneRarityBonus(17),
  },
  {
    id: 18, act: 2, name: 'Bioluminescent Grotto', levelRange: zoneLevel(18),
    mobs: [
      makeMob('glowworm_swarm', 'Glowworm Swarm', false, 18),
      makeMob('luminous_jelly', 'Luminous Jelly', false, 18),
      makeMob('cave_sprite', 'Cave Sprite', false, 18),
    ],
    boss: makeMob('grotto_keeper', 'Grotto Keeper', true, 18),
    unlockCost: 0, rarityBonus: zoneRarityBonus(18),
  },
  {
    id: 19, act: 2, name: 'Magma Veins', levelRange: zoneLevel(19),
    mobs: [
      makeMob('lava_slime', 'Lava Slime', false, 19),
      makeMob('fire_beetle', 'Fire Beetle', false, 19),
      makeMob('magma_hound', 'Magma Hound', false, 19),
    ],
    boss: makeMob('molten_core', 'Molten Core', true, 19),
    unlockCost: 0, rarityBonus: zoneRarityBonus(19),
  },
  {
    id: 20, act: 2, name: 'The Undercity', levelRange: zoneLevel(20),
    mobs: [
      makeMob('ratfolk_thief', 'Ratfolk Thief', false, 20),
      makeMob('sewer_gator', 'Sewer Gator', false, 20),
      makeMob('plague_rat', 'Plague Rat', false, 20),
    ],
    boss: makeMob('king_of_depths', 'King of the Depths', true, 20),
    unlockCost: 0, rarityBonus: zoneRarityBonus(20),
  },

  // ========== ACT 3: THE SCORCHED EXPANSE (Zones 21-30) ==========
  {
    id: 21, act: 3, name: 'Burning Sands', levelRange: zoneLevel(21),
    mobs: [
      makeMob('sand_scorpion', 'Sand Scorpion', false, 21),
      makeMob('dust_devil', 'Dust Devil', false, 21),
      makeMob('desert_raider', 'Desert Raider', false, 21),
    ],
    boss: makeMob('sand_titan', 'Sand Titan', true, 21),
    unlockCost: 0, rarityBonus: zoneRarityBonus(21),
  },
  {
    id: 22, act: 3, name: 'Oasis of Bones', levelRange: zoneLevel(22),
    mobs: [
      makeMob('jackal_pack', 'Jackal Pack', false, 22),
      makeMob('vulture_swarm', 'Vulture Swarm', false, 22),
      makeMob('skeletal_nomad', 'Skeletal Nomad', false, 22),
    ],
    boss: makeMob('bone_pharaoh', 'Bone Pharaoh', true, 22),
    unlockCost: 0, rarityBonus: zoneRarityBonus(22),
  },
  {
    id: 23, act: 3, name: 'Sun-Bleached Ruins', levelRange: zoneLevel(23),
    mobs: [
      makeMob('mummy_guardian', 'Mummy Guardian', false, 23),
      makeMob('sand_wraith', 'Sand Wraith', false, 23),
      makeMob('clay_golem', 'Clay Golem', false, 23),
    ],
    boss: makeMob('pharaohs_shade', "Pharaoh's Shade", true, 23),
    unlockCost: 0, rarityBonus: zoneRarityBonus(23),
  },
  {
    id: 24, act: 3, name: 'Serpent Canyon', levelRange: zoneLevel(24),
    mobs: [
      makeMob('sidewinder', 'Sidewinder', false, 24),
      makeMob('canyon_hawk', 'Canyon Hawk', false, 24),
      makeMob('sand_worm_spawn', 'Sand Worm Spawn', false, 24),
    ],
    boss: makeMob('great_sand_wyrm', 'Great Sand Wyrm', true, 24),
    unlockCost: 0, rarityBonus: zoneRarityBonus(24),
  },
  {
    id: 25, act: 3, name: 'Volcanic Approach', levelRange: zoneLevel(25),
    mobs: [
      makeMob('ember_imp', 'Ember Imp', false, 25),
      makeMob('ash_crawler', 'Ash Crawler', false, 25),
      makeMob('flame_sprite', 'Flame Sprite', false, 25),
    ],
    boss: makeMob('lava_elemental', 'Lava Elemental', true, 25),
    unlockCost: 0, rarityBonus: zoneRarityBonus(25),
  },
  {
    id: 26, act: 3, name: 'Obsidian Desert', levelRange: zoneLevel(26),
    mobs: [
      makeMob('glass_scorpion', 'Glass Scorpion', false, 26),
      makeMob('mirage_phantom', 'Mirage Phantom', false, 26),
      makeMob('obsidian_drake', 'Obsidian Drake', false, 26),
    ],
    boss: makeMob('desert_colossus', 'Desert Colossus', true, 26),
    unlockCost: 0, rarityBonus: zoneRarityBonus(26),
  },
  {
    id: 27, act: 3, name: 'Scorched Citadel', levelRange: zoneLevel(27),
    mobs: [
      makeMob('fire_cultist', 'Fire Cultist', false, 27),
      makeMob('hellhound_pup', 'Hellhound Pup', false, 27),
      makeMob('cinder_knight', 'Cinder Knight', false, 27),
    ],
    boss: makeMob('pyromancer_lord', 'Pyromancer Lord', true, 27),
    unlockCost: 0, rarityBonus: zoneRarityBonus(27),
  },
  {
    id: 28, act: 3, name: 'Ashen Wastes', levelRange: zoneLevel(28),
    mobs: [
      makeMob('ash_zombie', 'Ash Zombie', false, 28),
      makeMob('cinder_wraith', 'Cinder Wraith', false, 28),
      makeMob('charred_beast', 'Charred Beast', false, 28),
    ],
    boss: makeMob('ashbringer', 'Ashbringer', true, 28),
    unlockCost: 0, rarityBonus: zoneRarityBonus(28),
  },
  {
    id: 29, act: 3, name: "Dragon's Graveyard", levelRange: zoneLevel(29),
    mobs: [
      makeMob('bone_dragon_spawn', 'Bone Dragon Spawn', false, 29),
      makeMob('grave_robber', 'Grave Robber', false, 29),
      makeMob('fossil_golem', 'Fossil Golem', false, 29),
    ],
    boss: makeMob('elder_drake_skeleton', 'Elder Drake Skeleton', true, 29),
    unlockCost: 0, rarityBonus: zoneRarityBonus(29),
  },
  {
    id: 30, act: 3, name: 'Infernal Gate', levelRange: zoneLevel(30),
    mobs: [
      makeMob('demon_scout', 'Demon Scout', false, 30),
      makeMob('fire_elemental', 'Fire Elemental', false, 30),
      makeMob('magma_serpent', 'Magma Serpent', false, 30),
    ],
    boss: makeMob('gatekeeper_of_flame', 'Gatekeeper of Flame', true, 30),
    unlockCost: 0, rarityBonus: zoneRarityBonus(30),
  },

  // ========== ACT 4: THE FROZEN PEAKS (Zones 31-40) ==========
  {
    id: 31, act: 4, name: 'Frost Frontier', levelRange: zoneLevel(31),
    mobs: [
      makeMob('frost_wolf', 'Frost Wolf', false, 31),
      makeMob('snow_hare', 'Snow Hare', false, 31),
      makeMob('ice_goblin', 'Ice Goblin', false, 31),
    ],
    boss: makeMob('frost_giant', 'Frost Giant', true, 31),
    unlockCost: 0, rarityBonus: zoneRarityBonus(31),
  },
  {
    id: 32, act: 4, name: 'Blizzard Pass', levelRange: zoneLevel(32),
    mobs: [
      makeMob('yeti', 'Yeti', false, 32),
      makeMob('ice_wraith', 'Ice Wraith', false, 32),
      makeMob('frozen_revenant', 'Frozen Revenant', false, 32),
    ],
    boss: makeMob('blizzard_lord', 'Blizzard Lord', true, 32),
    unlockCost: 0, rarityBonus: zoneRarityBonus(32),
  },
  {
    id: 33, act: 4, name: 'Glacier Cavern', levelRange: zoneLevel(33),
    mobs: [
      makeMob('ice_beetle', 'Ice Beetle', false, 33),
      makeMob('frost_slime', 'Frost Slime', false, 33),
      makeMob('crystal_spider', 'Crystal Spider', false, 33),
    ],
    boss: makeMob('glacial_behemoth', 'Glacial Behemoth', true, 33),
    unlockCost: 0, rarityBonus: zoneRarityBonus(33),
  },
  {
    id: 34, act: 4, name: 'Howling Ridge', levelRange: zoneLevel(34),
    mobs: [
      makeMob('snow_harpy', 'Snow Harpy', false, 34),
      makeMob('mountain_troll', 'Mountain Troll', false, 34),
      makeMob('frost_hawk', 'Frost Hawk', false, 34),
    ],
    boss: makeMob('storm_caller', 'Storm Caller', true, 34),
    unlockCost: 0, rarityBonus: zoneRarityBonus(34),
  },
  {
    id: 35, act: 4, name: 'Frozen Lake', levelRange: zoneLevel(35),
    mobs: [
      makeMob('lake_horror', 'Lake Horror', false, 35),
      makeMob('ice_elemental', 'Ice Elemental', false, 35),
      makeMob('frost_nymph', 'Frost Nymph', false, 35),
    ],
    boss: makeMob('the_frozen_one', 'The Frozen One', true, 35),
    unlockCost: 0, rarityBonus: zoneRarityBonus(35),
  },
  {
    id: 36, act: 4, name: 'Avalanche Valley', levelRange: zoneLevel(36),
    mobs: [
      makeMob('snow_golem', 'Snow Golem', false, 36),
      makeMob('icefall_bat', 'Icefall Bat', false, 36),
      makeMob('arctic_fox', 'Arctic Fox', false, 36),
    ],
    boss: makeMob('avalanche_wyrm', 'Avalanche Wyrm', true, 36),
    unlockCost: 0, rarityBonus: zoneRarityBonus(36),
  },
  {
    id: 37, act: 4, name: 'Shattered Monastery', levelRange: zoneLevel(37),
    mobs: [
      makeMob('frozen_monk', 'Frozen Monk', false, 37),
      makeMob('ice_phantom', 'Ice Phantom', false, 37),
      makeMob('frost_knight', 'Frost Knight', false, 37),
    ],
    boss: makeMob('abbot_of_ice', 'Abbot of Ice', true, 37),
    unlockCost: 0, rarityBonus: zoneRarityBonus(37),
  },
  {
    id: 38, act: 4, name: 'Permafrost Tunnels', levelRange: zoneLevel(38),
    mobs: [
      makeMob('ice_worm', 'Ice Worm', false, 38),
      makeMob('frozen_corpse', 'Frozen Corpse', false, 38),
      makeMob('crystal_sentinel', 'Crystal Sentinel', false, 38),
    ],
    boss: makeMob('frostbite_colossus', 'Frostbite Colossus', true, 38),
    unlockCost: 0, rarityBonus: zoneRarityBonus(38),
  },
  {
    id: 39, act: 4, name: 'Aurora Peaks', levelRange: zoneLevel(39),
    mobs: [
      makeMob('star_sprite', 'Star Sprite', false, 39),
      makeMob('aurora_wolf', 'Aurora Wolf', false, 39),
      makeMob('celestial_hawk', 'Celestial Hawk', false, 39),
    ],
    boss: makeMob('northern_guardian', 'Northern Guardian', true, 39),
    unlockCost: 0, rarityBonus: zoneRarityBonus(39),
  },
  {
    id: 40, act: 4, name: 'Throne of Winter', levelRange: zoneLevel(40),
    mobs: [
      makeMob('ice_paladin', 'Ice Paladin', false, 40),
      makeMob('winter_wraith', 'Winter Wraith', false, 40),
      makeMob('frozen_titan', 'Frozen Titan', false, 40),
    ],
    boss: makeMob('the_winter_king', 'The Winter King', true, 40),
    unlockCost: 0, rarityBonus: zoneRarityBonus(40),
  },

  // ========== ACT 5: THE DEMONIC WASTES (Zones 41-50) ==========
  {
    id: 41, act: 5, name: 'Corrupted Borderlands', levelRange: zoneLevel(41),
    mobs: [
      makeMob('imp', 'Imp', false, 41),
      makeMob('tainted_wolf', 'Tainted Wolf', false, 41),
      makeMob('cursed_soldier', 'Cursed Soldier', false, 41),
    ],
    boss: makeMob('corruption_spawn', 'Corruption Spawn', true, 41),
    unlockCost: 0, rarityBonus: zoneRarityBonus(41),
  },
  {
    id: 42, act: 5, name: 'Blighted Forest', levelRange: zoneLevel(42),
    mobs: [
      makeMob('plague_treant', 'Plague Treant', false, 42),
      makeMob('toxic_crawler', 'Toxic Crawler', false, 42),
      makeMob('blight_sprite', 'Blight Sprite', false, 42),
    ],
    boss: makeMob('blight_mother', 'Blight Mother', true, 42),
    unlockCost: 0, rarityBonus: zoneRarityBonus(42),
  },
  {
    id: 43, act: 5, name: 'Bone Fields', levelRange: zoneLevel(43),
    mobs: [
      makeMob('skeletal_warrior', 'Skeletal Warrior', false, 43),
      makeMob('bone_archer', 'Bone Archer', false, 43),
      makeMob('death_knight', 'Death Knight', false, 43),
    ],
    boss: makeMob('bone_lord', 'Bone Lord', true, 43),
    unlockCost: 0, rarityBonus: zoneRarityBonus(43),
  },
  {
    id: 44, act: 5, name: 'Blood Marsh', levelRange: zoneLevel(44),
    mobs: [
      makeMob('blood_leech', 'Blood Leech', false, 44),
      makeMob('crimson_wraith', 'Crimson Wraith', false, 44),
      makeMob('flesh_golem', 'Flesh Golem', false, 44),
    ],
    boss: makeMob('blood_titan', 'Blood Titan', true, 44),
    unlockCost: 0, rarityBonus: zoneRarityBonus(44),
  },
  {
    id: 45, act: 5, name: 'Hellfire Wastes', levelRange: zoneLevel(45),
    mobs: [
      makeMob('hell_imp', 'Hell Imp', false, 45),
      makeMob('fire_demon', 'Fire Demon', false, 45),
      makeMob('infernal_hound', 'Infernal Hound', false, 45),
    ],
    boss: makeMob('infernal_captain', 'Infernal Captain', true, 45),
    unlockCost: 0, rarityBonus: zoneRarityBonus(45),
  },
  {
    id: 46, act: 5, name: 'Shadow Citadel', levelRange: zoneLevel(46),
    mobs: [
      makeMob('shadow_assassin', 'Shadow Assassin', false, 46),
      makeMob('dark_sorcerer', 'Dark Sorcerer', false, 46),
      makeMob('void_walker', 'Void Walker', false, 46),
    ],
    boss: makeMob('shadow_prince', 'Shadow Prince', true, 46),
    unlockCost: 0, rarityBonus: zoneRarityBonus(46),
  },
  {
    id: 47, act: 5, name: 'Abyssal Rift', levelRange: zoneLevel(47),
    mobs: [
      makeMob('rift_spawn', 'Rift Spawn', false, 47),
      makeMob('void_tentacle', 'Void Tentacle', false, 47),
      makeMob('chaos_elemental', 'Chaos Elemental', false, 47),
    ],
    boss: makeMob('rift_guardian', 'Rift Guardian', true, 47),
    unlockCost: 0, rarityBonus: zoneRarityBonus(47),
  },
  {
    id: 48, act: 5, name: "Demon's Forge", levelRange: zoneLevel(48),
    mobs: [
      makeMob('iron_demon', 'Iron Demon', false, 48),
      makeMob('forge_golem', 'Forge Golem', false, 48),
      makeMob('flame_overseer', 'Flame Overseer', false, 48),
    ],
    boss: makeMob('forge_master', 'Forge Master', true, 48),
    unlockCost: 0, rarityBonus: zoneRarityBonus(48),
  },
  {
    id: 49, act: 5, name: 'Throne of Despair', levelRange: zoneLevel(49),
    mobs: [
      makeMob('fallen_angel', 'Fallen Angel', false, 49),
      makeMob('doom_knight', 'Doom Knight', false, 49),
      makeMob('abyssal_horror', 'Abyssal Horror', false, 49),
    ],
    boss: makeMob('despair_incarnate', 'Despair Incarnate', true, 49),
    unlockCost: 0, rarityBonus: zoneRarityBonus(49),
  },
  {
    id: 50, act: 5, name: 'The Abyss Gate', levelRange: zoneLevel(50),
    mobs: [
      makeMob('archfiend_guard', 'Archfiend Guard', false, 50),
      makeMob('void_champion', 'Void Champion', false, 50),
      makeMob('demon_lord', 'Demon Lord', false, 50),
    ],
    boss: makeMob('the_archfiend', 'The Archfiend', true, 50),
    unlockCost: 0, rarityBonus: zoneRarityBonus(50),
  },
];

// --- Helpers ---

export function getZone(id: number): ZoneDef | undefined {
  return ZONES.find(z => z.id === id);
}

/** Get all mob definitions from all zones (for endless mode mob pool) */
export function getAllMobs(): MobDef[] {
  const mobs: MobDef[] = [];
  for (const zone of ZONES) {
    mobs.push(...zone.mobs);
  }
  return mobs;
}
