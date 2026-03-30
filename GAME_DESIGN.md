# Endless Loot — Game Design Document

## Overview

**Endless Loot** is a semi-idle RPG where a character endlessly fights mobs, collects randomized loot, equips gear to get stronger, and progresses through increasingly difficult zones. The player manages gear, stat allocation, and zone selection while combat runs automatically.

**Stack:** React + Vite + TypeScript
**Art Style:** Card/portrait based with AI-generated portraits
**Idle Level:** Semi-idle — auto-fights, player manages gear/stats/zones

---

## Core Design Summary

| Aspect | Decision |
|---|---|
| Idle level | Semi-idle — auto-fights, player manages gear/stats/zones |
| Combat | Auto-attack with filling progress bar (2-4s per mob) |
| Loot | Diablo-style random rolls, 5 rarity tiers |
| Stats | STR/DEX/INT/VIT with stat point allocation on level up |
| Gear slots | 8 slots: Weapon, Shield/Offhand, Helmet, Chest, Legs, Boots, Ring, Amulet |
| Zones | Linear progression, boss gates each zone |
| Death | Auto-retreat to previous zone |
| Inventory | Unlimited, sell for gold or salvage for materials |
| Gold sinks | Stat training (permanent base stat boosts) |
| Offline | Full offline progress calculation |
| Art | AI-generated portraits for character, mobs, items |
| Classes | Classless — stat allocation IS your class |
| Post-MVP | Crafting & enchanting system |

---

## MVP Scope (Tiny — Day 1)

### What's in MVP
- 1 character with STR/DEX/INT/VIT stats
- Level-up system with stat point allocation
- Auto-attack combat with progress bar
- 5 mob types across 2-3 zones
- Zone boss gating progression
- Loot drops with 5 rarity tiers and randomized stats
- 8 equipment slots
- Unlimited inventory with sell/salvage options
- Gold currency + stat training
- Save/load to localStorage
- Full offline progress on return

### What's NOT in MVP
- Crafting/enchanting (post-MVP)
- Prestige/reset mechanics
- Skills/abilities
- Pets/companions
- Sound/music
- Multiple save slots

---

## Detailed System Design

### 1. Character & Stats

**Primary Stats** (player allocates points on level up):
- **STR** — Increases physical attack damage
- **DEX** — Increases attack speed, crit chance, dodge chance
- **INT** — Increases magic damage (future-proofs for spell system), mana/ability power
- **VIT** — Increases max HP, HP regen, defense

**Derived Stats** (calculated from primary stats + gear):
- `Attack Power` = base + STR * scaling + weapon damage
- `Attack Speed` = base + DEX * scaling (affects progress bar fill rate)
- `Crit Chance` = base + DEX * scaling (%)
- `Crit Damage` = 150% base (can be modified by gear)
- `Max HP` = base + VIT * scaling + armor HP
- `Defense` = base + VIT * scaling + armor defense (flat damage reduction)
- `Dodge Chance` = base + DEX * scaling (%)

**Classless System:**
- No predefined classes — the player's stat allocation defines their build
- STR-heavy = melee bruiser, DEX-heavy = fast crit-based fighter, INT-heavy = magic damage, VIT-heavy = tank
- Hybrid builds are viable and encouraged

**Leveling:**
- Mobs give XP based on their level/zone
- XP to next level scales exponentially: `100 * level^1.5`
- Each level grants 3 stat points to allocate
- Stats can also be permanently boosted by spending gold at the "Training" panel

### 2. Combat System

**Flow:**
1. Character enters a zone -> fights the first mob
2. Attack progress bar fills over time (rate = attack speed)
3. When bar fills -> character deals damage to mob
4. Mob has its own attack timer -> deals damage to character
5. If mob HP <= 0 -> loot roll -> next mob spawns
6. If character HP <= 0 -> death -> auto-retreat to previous zone, HP resets
7. Character HP regenerates slowly between/during fights

**Damage Formula:**
```
raw_damage = attack_power * (0.9 + random * 0.2)  // +/-10% variance
is_crit = random < crit_chance
final_damage = raw_damage * (is_crit ? crit_multiplier : 1)
damage_taken = max(1, final_damage - target_defense)
```

**Dodge Check:**
```
is_dodged = random < dodge_chance
if (is_dodged) damage_taken = 0  // "DODGE" displayed
```

**Zone Bosses:**
- Last mob in each zone is a boss (3-5x HP, 1.5x damage, 1.5x XP)
- Guaranteed Rare+ drop on kill
- Killing boss unlocks next zone
- Boss can be re-fought for loot farming

**Combat Pacing:**
- Regular mobs should die in 2-4 seconds when appropriately geared
- Bosses should take 10-20 seconds
- If a fight takes >30 seconds, the player is undergeared for the zone

### 3. Loot System

**Rarity Tiers:**
| Tier | Color | Drop Rate | Stat Range Multiplier | Bonus Stats |
|---|---|---|---|---|
| Common | White (#CCCCCC) | 50% | 1.0x | 0 |
| Uncommon | Green (#00CC00) | 30% | 1.3x | 1 |
| Rare | Blue (#4444FF) | 14% | 1.7x | 1-2 |
| Epic | Purple (#AA00FF) | 5% | 2.2x | 2-3 |
| Legendary | Orange (#FF8800) | 1% | 3.0x | 3 + possible unique effect |

**Item Generation Algorithm:**
1. Pick slot (weighted random — any of the 8 slots)
2. Pick rarity (weighted random per table above, zone level can shift weights slightly)
3. Pick base item type for that slot (e.g., "Iron Sword", "Steel Helm")
4. Roll primary stat (e.g., weapon = ATK value within range for item level * rarity multiplier)
5. Roll bonus stats based on rarity count from table above
6. Bonus stats drawn from pool: +STR, +DEX, +INT, +VIT, +Crit%, +Dodge%, +HP, +DEF

**Item Level:** Items drop at the zone's level range. Higher zones = higher base stats.

**Drop Rate:** ~50-70% chance of ANY item dropping per mob kill. Boss = 100% drop + guaranteed Rare+.

### 4. Equipment Slots

| Slot | Primary Stat | Notes |
|---|---|---|
| Weapon | Attack Power | Biggest damage source |
| Shield/Offhand | Defense, Block% | Trade-off: dual wield (future) vs defense |
| Helmet | Defense, HP | |
| Chest Armor | Defense (highest) | Main defensive piece |
| Legs | Defense, HP | |
| Boots | Defense, Speed | Attack speed bonus |
| Ring | Any offensive stat | Crit, attack power, etc. |
| Amulet | Any stat | Versatile slot |

### 5. Zones & Mobs

**MVP Zones:**
| Zone | Name | Mob Level | Mobs | Boss |
|---|---|---|---|---|
| 1 | Whispering Woods | 1-3 | Slime, Wolf, Goblin | Goblin Chief |
| 2 | Dusty Caverns | 4-7 | Bat, Skeleton, Spider | Cave Troll |
| 3 | Ruined Fortress | 8-12 | Bandit, Dark Knight, Wraith | Fallen Commander |

**Mob Stat Scaling:**
- Each mob has base HP, ATK, DEF, XP reward, gold drop
- Stats scale linearly with mob level within the zone
- Base formula: `stat = base_stat * (1 + 0.15 * level)`
- Higher zones have better loot table weights (slightly more rares, etc.)

**Mob XP/Gold:**
- XP: `10 * mob_level * (1 + 0.1 * zone_number)`
- Gold: `5 * mob_level * (1 + 0.15 * zone_number)`
- Boss multiplier: 1.5x XP, 3x gold

### 6. Inventory & Economy

**Inventory:**
- Unlimited capacity
- Sort by: slot, rarity, level, stat value
- Filter by: slot type, rarity minimum
- Compare tooltip: hover/click item shows stat diff vs currently equipped item
- Quick-equip: click to equip if it's for an empty slot or an upgrade

**Sell:** Items -> Gold
- Sell value: `base_value * rarity_multiplier * item_level`
- Common: 5g base, Uncommon: 15g, Rare: 50g, Epic: 200g, Legendary: 1000g

**Salvage:** Items -> Crafting Materials (for future crafting system)
- Common -> Scrap
- Uncommon -> Fragments
- Rare -> Crystals
- Epic -> Essences
- Legendary -> Legendary Shards
- Materials are stockpiled in inventory for when crafting is implemented

**Gold Uses:**
- Stat Training: Spend increasing gold to permanently boost base STR/DEX/INT/VIT
  - Cost formula: `100 * (current_training_level + 1)^2`
  - Each training level grants +1 to that base stat
  - Separate training track per stat (can train STR independently of DEX, etc.)

### 7. Offline Progress

**On game load:**
1. Calculate elapsed seconds since last save timestamp
2. Simulate combat at average kill rate:
   - `avg_fight_duration` = estimated from player stats vs current zone average mob
   - `kills = elapsed_seconds / avg_fight_duration`
   - `gold_earned = kills * avg_gold_per_kill`
   - `xp_earned = kills * avg_xp_per_kill`
   - `items_found = kills * drop_rate` (generate that many random items, cap at ~100 to avoid lag)
3. Apply level-ups from XP gained (bank stat points for player to allocate)
4. Show "Welcome Back" modal summarizing:
   - Time away
   - Mobs killed
   - XP gained (and levels earned)
   - Gold earned
   - Items found (by rarity breakdown)
   - Unspent stat points available

### 8. Save System

- Auto-save every 30 seconds to localStorage
- Save on: zone change, equipment change, stat allocation, item sell/salvage
- localStorage key: `endless_loot_save`
- Save data structure: full GameState (character stats, level, XP, equipment, inventory, current zone, gold, materials, training levels, save timestamp)
- Version the save format for future migration

### 9. UI Layout

```
+---------------------------------------------------+
|  [Character]  [Inventory]  [Training]  [Zones]    |  <- Nav tabs
+------------------------+--------------------------+
|                        |                          |
|   CHARACTER PANEL      |     COMBAT VIEWPORT      |
|   +------------+       |   +------------------+   |
|   | Portrait   |       |   |  Mob Portrait    |   |
|   +------------+       |   |  Mob Name & HP   |   |
|   Name  Lv. 5          |   |  ########.. 70%  |   |
|   HP ######## 80%      |   |                  |   |
|   ATK: 45  DEF: 12     |   |  [ATK BAR ####.] |   |
|   SPD: 1.2  CRT: 8%    |   |                  |   |
|                        |   |  -23! (dmg pop)  |   |
|   [Equipment Grid]     |   +------------------+   |
|   [Helm] [Amul]        |                          |
|   [Weap] [Chest]       |   Zone: Whispering Woods |
|   [Shld] [Legs]        |   Kill Count: 1,247      |
|   [Ring] [Boot]        |   Gold: 3,450            |
|                        |                          |
+------------------------+--------------------------+
|  Combat Log: Dealt 23 dmg -> Goblin (47/70 HP)   |
|  Loot: [Rare] Iron Helm of Vitality dropped!      |
+---------------------------------------------------+
```

**Panels (switched via nav tabs):**
- **Character** — Stats, equipment grid, level/XP bar, stat point allocation
- **Inventory** — All items in a scrollable list/grid, sort/filter controls, sell/salvage buttons, compare tooltips
- **Training** — Spend gold to permanently boost base stats (one button per stat with cost shown)
- **Zones** — Zone list with current zone highlighted, boss defeated status, click to change zone

**Color Palette:**
- Dark background theme
- Rarity colors as defined in loot table
- Gold accent for currency/important UI elements
- Red for HP/damage, green for healing/positive effects

---

## Implementation Order (MVP)

### Phase 1: Project Setup
- Scaffold Vite + React + TypeScript project (`npm create vite@latest`)
- Set up file structure per the key files list below
- Create core type definitions in `types.ts`

### Phase 2: Data Layer
- Define stat formulas and derived stat calculations in `formulas.ts`
- Define zone/mob data tables in `zones.ts`
- Define item base types and generation tables in `items.ts`
- Define loot rarity weights and rolling logic in `loot.ts`

### Phase 3: Core Game Loop
- Implement game tick via `useGameLoop` hook (requestAnimationFrame or setInterval)
- Implement combat system: attack timer, damage calc, mob death, XP/gold rewards
- Implement loot generation on mob kill
- Implement zone progression and boss fights
- Implement death/retreat mechanic

### Phase 4: Character Systems
- Implement leveling (XP -> level up -> stat points available)
- Implement stat point allocation UI
- Implement equipment system (equip/unequip, derived stat recalculation)
- Implement gold training (permanent stat boosts)

### Phase 5: UI
- Build layout shell with nav tabs (`Layout.tsx`)
- Build combat viewport (`CombatView.tsx` — mob portrait, HP bars, attack bar, damage popups)
- Build character panel (`CharacterPanel.tsx` — stats, equipment grid)
- Build inventory panel (`InventoryPanel.tsx` — item list, sort/filter, sell/salvage, compare)
- Build training panel (`TrainingPanel.tsx`)
- Build zone selection panel (`ZonePanel.tsx`)

### Phase 6: Persistence
- Implement save/load to localStorage (`save.ts`)
- Implement auto-save on interval and key actions
- Implement offline progress calculation
- Build "Welcome Back" modal (`WelcomeBack.tsx`)

### Phase 7: Polish
- Add AI-generated portraits for character, mobs, items
- Loot drop animations / rarity glow effects via CSS
- Damage number popups with CSS animations
- Stat comparison tooltips on hover
- Responsive layout adjustments

---

## Key Files

```
endless-loot/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── GAME_DESIGN.md          # This file
├── public/
│   └── portraits/          # AI-generated art assets
├── src/
│   ├── main.tsx            # Entry point, renders App
│   ├── App.tsx             # Root component, game state provider
│   ├── types.ts            # All type definitions (GameState, Item, Mob, Zone, etc.)
│   ├── data/
│   │   ├── zones.ts        # Zone & mob definitions
│   │   ├── items.ts        # Item base types & generation tables
│   │   └── formulas.ts     # Stat formulas, XP curves, damage scaling
│   ├── systems/
│   │   ├── combat.ts       # Combat loop logic, damage calc, attack timer
│   │   ├── loot.ts         # Item generation, rarity rolling
│   │   ├── progression.ts  # XP, leveling, zone unlocking
│   │   ├── economy.ts      # Gold, sell, salvage, training
│   │   ├── save.ts         # Save/load, offline progress calc
│   │   └── gameLoop.ts     # Main tick orchestrator
│   ├── hooks/
│   │   ├── useGameState.ts # Central game state management hook
│   │   └── useGameLoop.ts  # Game tick hook (drives combat/systems)
│   ├── components/
│   │   ├── Layout.tsx       # Main layout with nav tabs
│   │   ├── CombatView.tsx   # Mob portrait, HP bars, attack bar, damage numbers
│   │   ├── CharacterPanel.tsx # Stats display, equipment grid, stat allocation
│   │   ├── InventoryPanel.tsx # Item list, sort/filter, sell/salvage actions
│   │   ├── TrainingPanel.tsx  # Gold-based stat training
│   │   ├── ZonePanel.tsx      # Zone selection list
│   │   ├── ItemCard.tsx       # Single item display with rarity border/color
│   │   ├── StatBar.tsx        # Reusable progress bar (HP, XP, attack timer)
│   │   └── WelcomeBack.tsx    # Offline progress summary modal
│   └── styles/
│       └── index.css        # Global styles, rarity colors, dark theme
```

---

## Post-MVP Roadmap

### Crafting & Enchanting (Priority 1)
- Salvage materials become useful
- Craft specific item types using materials
- Enchant existing gear to add/reroll bonus stats
- Recipes discovered via zone progression or achievements

### Future Considerations (Unplanned)
- Prestige/rebirth system
- Skills & abilities (active or passive)
- Pet/companion system
- Achievements & milestones
- Sound effects & music
- Multiple save slots
- Class specializations (unlock at certain level thresholds)
- PvP or leaderboard systems
- Set items with set bonuses
