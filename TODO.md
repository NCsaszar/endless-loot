# Endless Loot — TODO

## Completed
- [x] Phase 1: Project scaffolding (Vite + React 19 + TypeScript)
- [x] Types & interfaces (`src/types.ts`) — GameState, Item, Mob, Zone, Combat, etc.
- [x] Zone & mob definitions (`src/data/zones.ts`) — 3 zones, 9 mobs, 3 bosses
- [x] Item base types (`src/data/items.ts`) — 24 items across 8 equipment slots
- [x] Stat formulas (`src/data/formulas.ts`) — XP curves, derived stats, scaling, training costs
- [x] Loot generation (`src/systems/loot.ts`) — Rarity rolling, bonus stats, affix naming, salvage
- [x] Combat system (`src/systems/combat.ts`) — Attack timers, damage calc, crit/dodge, mob death, HP regen
- [x] Progression system (`src/systems/progression.ts`) — XP gain, leveling, stat allocation, zone unlock
- [x] Economy system (`src/systems/economy.ts`) — Sell, salvage, equip/unequip, stat training
- [x] Save system (`src/systems/save.ts`) — localStorage save/load, auto-save, offline progress
- [x] Game loop (`src/systems/gameLoop.ts`) — Tick orchestrator tying all systems together
- [x] Game state hook (`src/hooks/useGameState.tsx`) — Context provider, all game actions
- [x] App.tsx — Game root with GameProvider
- [x] Layout.tsx — Shell with nav tabs (Character, Inventory, Training, Zones)
- [x] CombatView.tsx — Mob portrait, HP bars, attack timer bars, combat log
- [x] CharacterPanel.tsx — Stats, equipment grid, level/XP bar, stat allocation
- [x] InventoryPanel.tsx — Item list, sort/filter, sell/salvage, compare tooltips
- [x] TrainingPanel.tsx — Gold-based permanent stat training + materials display
- [x] ZonePanel.tsx — Zone list, boss status, zone switching
- [x] ItemCard.tsx — Item display with rarity colors
- [x] StatBar.tsx — Reusable progress bar
- [x] WelcomeBack.tsx — Offline progress summary modal
- [x] Dark theme + rarity color CSS (`src/styles/game.css`)
- [x] Auto-save every 30s, load on start, offline progress calc

## Remaining Polish
- [ ] Damage popup animations (floating numbers)
- [ ] Loot drop glow effects
- [ ] AI-generated portraits (character, mobs, items)
- [ ] Responsive layout for mobile
- [ ] Sound effects

## Post-MVP Ideas
- [ ] Crafting & enchanting system (salvage materials become useful)
- [ ] Prestige/rebirth system
- [ ] Skills & abilities
- [ ] Pet/companion system
- [ ] Set items with set bonuses
- [ ] Sound effects & music
