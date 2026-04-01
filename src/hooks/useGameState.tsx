import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, DerivedStats, Item, ActivePanel, Rarity, PrimaryStat, Essence } from '../types';
import { getTotalPrimaryStats, calculateDerivedStats } from '../data/formulas';
import { tick } from '../systems/gameLoop';
import { saveGame, loadGame, createDefaultState, calculateOfflineProgress } from '../systems/save';
import { sellItem, salvageItem, equipItem, unequipItem, bulkSell, bulkSalvage } from '../systems/economy';
import { allocateStat, allocateStatMultiple, resetAllStats, changeZone, startCombat, stopCombat, startEndlessRun, endEndlessRun } from '../systems/progression';
import { handleDeathRetreat, handleDeathRetry } from '../systems/combat';
import { generateItem } from '../systems/loot';
import { dismantleItem, bulkDismantle, slotEssence, discardEssences, upgradeEssence } from '../systems/blacksmith';
import type { EssenceFilter } from '../systems/blacksmith';
import type { OfflineProgress } from '../systems/save';

interface GameContextValue {
  state: GameState;
  derived: DerivedStats;
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;
  doAllocateStat: (stat: PrimaryStat) => void;
  doAllocateStatMultiple: (stat: PrimaryStat, amount: number) => void;
  doResetAllStats: () => boolean;
  doEquipItem: (item: Item) => void;
  doUnequipItem: (slot: Item['slot']) => void;
  doSellItem: (itemId: string) => void;
  doSalvageItem: (itemId: string) => void;
  doChangeZone: (zoneId: number) => void;
  doStartCombat: () => void;
  doStopCombat: () => void;
  doResetGame: () => void;
  doStartEndlessRun: () => void;
  doEndEndlessRun: () => void;
  doToggleAutoSell: (rarity: Rarity) => void;
  doToggleAutoSalvage: (rarity: Rarity) => void;
  doToggleLock: (itemId: string) => void;
  doBulkSell: (itemIds: string[]) => void;
  doBulkSalvage: (itemIds: string[]) => void;
  doDismantleItem: (itemId: string) => Essence[];
  doBulkDismantle: (itemIds: string[]) => Essence[];
  doSlotEssence: (itemId: string, essenceId: string, slotIndex: number) => boolean;
  doUpgradeEssence: (itemId: string, essenceId: string) => boolean;
  doDiscardEssences: (filter: EssenceFilter) => number;
  doDeathRetreat: () => void;
  doDeathRetry: () => void;
  offlineProgress: OfflineProgress | null;
  dismissOfflineProgress: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [offlineProgress, setOfflineProgress] = useState<OfflineProgress | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('character');
  const [, forceUpdate] = useState(0);

  const stateRef = useRef<GameState>(null!);
  const derivedRef = useRef<DerivedStats>(null!);
  const primaryStatsRef = useRef<import('../types').PrimaryStats>(null!);
  const lastTickRef = useRef(0);
  const saveTimerRef = useRef(0);

  // Initialize state once
  if (stateRef.current === null) {
    const saved = loadGame();
    const state = saved ?? createDefaultState();

    // Offline progress
    if (saved) {
      const progress = calculateOfflineProgress(state);
      if (progress && progress.itemsFound > 0) {
        const zone = state.currentZoneId;
        for (let i = 0; i < progress.itemsFound; i++) {
          state.inventory.push(generateItem(state.character.level + zone));
        }
      }
      if (progress) {
        setOfflineProgress(progress);
      }
    }

    stateRef.current = state;
    const primary = getTotalPrimaryStats(state.character, state.equipment);
    primaryStatsRef.current = primary;
    derivedRef.current = calculateDerivedStats(primary, state.equipment);
    state.character.currentHp = Math.min(state.character.currentHp, derivedRef.current.maxHp);
    if (state.character.currentHp <= 0) state.character.currentHp = derivedRef.current.maxHp;
  }

  const recalcDerived = useCallback(() => {
    const s = stateRef.current;
    const primary = getTotalPrimaryStats(s.character, s.equipment);
    primaryStatsRef.current = primary;
    derivedRef.current = calculateDerivedStats(primary, s.equipment);
  }, []);

  // Game loop
  useEffect(() => {
    lastTickRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.1); // cap delta at 100ms
      lastTickRef.current = now;

      recalcDerived();
      tick(stateRef.current, derivedRef.current, dt, primaryStatsRef.current);

      // Auto-save every 10s
      saveTimerRef.current += dt;
      if (saveTimerRef.current >= 10) {
        saveTimerRef.current = 0;
        saveGame(stateRef.current);
      }

      forceUpdate(n => n + 1);
      frameId = requestAnimationFrame(loop);
    };

    let frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [recalcDerived]);

  // Save on page unload to prevent progress loss
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveGame(stateRef.current);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Catch up on elapsed time when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = performance.now();
        const elapsed = (now - lastTickRef.current) / 1000;

        if (elapsed > 2 && stateRef.current.combatActive) {
          // Tab was hidden long enough — simulate offline progress for the gap
          const progress = calculateOfflineProgress(stateRef.current, elapsed);
          if (progress && progress.itemsFound > 0) {
            const zone = stateRef.current.currentZoneId;
            for (let i = 0; i < progress.itemsFound; i++) {
              stateRef.current.inventory.push(
                generateItem(stateRef.current.character.level + zone)
              );
            }
          }
          if (progress) {
            setOfflineProgress(progress);
          }
          recalcDerived();
        }

        // Reset tick timer so game loop doesn't try to catch up with a huge dt
        lastTickRef.current = now;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [recalcDerived]);

  const doAllocateStat = useCallback((stat: PrimaryStat) => {
    allocateStat(stateRef.current, stat);
    recalcDerived();
    // Heal to new max if vit increased
    const s = stateRef.current;
    if (s.character.currentHp < derivedRef.current.maxHp) {
      s.character.currentHp = Math.min(s.character.currentHp + 8, derivedRef.current.maxHp);
    }
  }, [recalcDerived]);

  const doAllocateStatMultiple = useCallback((stat: PrimaryStat, amount: number) => {
    const allocated = allocateStatMultiple(stateRef.current, stat, amount);
    if (allocated > 0) {
      recalcDerived();
      const s = stateRef.current;
      if (stat === 'vit') {
        s.character.currentHp = Math.min(s.character.currentHp + 8 * allocated, derivedRef.current.maxHp);
      }
    }
  }, [recalcDerived]);

  const doResetAllStats = useCallback((): boolean => {
    const success = resetAllStats(stateRef.current);
    if (success) {
      recalcDerived();
      // Clamp HP to new (lower) max
      const s = stateRef.current;
      s.character.currentHp = Math.min(s.character.currentHp, derivedRef.current.maxHp);
    }
    return success;
  }, [recalcDerived]);

  const doEquipItem = useCallback((item: Item) => {
    equipItem(stateRef.current, item);
    recalcDerived();
    // Clamp HP to new max (gear may have changed maxHp)
    const s = stateRef.current;
    s.character.currentHp = Math.min(s.character.currentHp, derivedRef.current.maxHp);
  }, [recalcDerived]);

  const doUnequipItem = useCallback((slot: Item['slot']) => {
    unequipItem(stateRef.current, slot);
    recalcDerived();
    // Clamp HP to new max (removing VIT gear reduces maxHp)
    const s = stateRef.current;
    s.character.currentHp = Math.min(s.character.currentHp, derivedRef.current.maxHp);
  }, [recalcDerived]);

  const doSellItem = useCallback((itemId: string) => {
    sellItem(stateRef.current, itemId);
  }, []);

  const doSalvageItem = useCallback((itemId: string) => {
    salvageItem(stateRef.current, itemId);
  }, []);

  const doChangeZone = useCallback((zoneId: number) => {
    changeZone(stateRef.current, zoneId);
  }, []);

  const doStartCombat = useCallback(() => {
    startCombat(stateRef.current);
  }, []);

  const doStopCombat = useCallback(() => {
    stopCombat(stateRef.current);
  }, []);

  const doResetGame = useCallback(() => {
    stateRef.current = createDefaultState();
    recalcDerived();
    stateRef.current.character.currentHp = derivedRef.current.maxHp;
    saveGame(stateRef.current);
  }, [recalcDerived]);

  const doStartEndlessRun = useCallback(() => {
    startEndlessRun(stateRef.current);
  }, []);

  const doEndEndlessRun = useCallback(() => {
    endEndlessRun(stateRef.current);
  }, []);

  const doToggleAutoSell = useCallback((rarity: Rarity) => {
    const s = stateRef.current;
    const idx = s.autoSellRarities.indexOf(rarity);
    if (idx >= 0) {
      s.autoSellRarities.splice(idx, 1);
    } else {
      s.autoSellRarities.push(rarity);
      // Mutual exclusion: disable auto-salvage for this rarity
      const salvIdx = s.autoSalvageRarities.indexOf(rarity);
      if (salvIdx >= 0) s.autoSalvageRarities.splice(salvIdx, 1);
    }
  }, []);

  const doToggleAutoSalvage = useCallback((rarity: Rarity) => {
    const s = stateRef.current;
    const idx = s.autoSalvageRarities.indexOf(rarity);
    if (idx >= 0) {
      s.autoSalvageRarities.splice(idx, 1);
    } else {
      s.autoSalvageRarities.push(rarity);
      // Mutual exclusion: disable auto-sell for this rarity
      const sellIdx = s.autoSellRarities.indexOf(rarity);
      if (sellIdx >= 0) s.autoSellRarities.splice(sellIdx, 1);
    }
  }, []);

  const doToggleLock = useCallback((itemId: string) => {
    const item = stateRef.current.inventory.find(i => i.id === itemId);
    if (item) item.locked = !item.locked;
  }, []);

  const doBulkSell = useCallback((itemIds: string[]) => {
    bulkSell(stateRef.current, itemIds);
  }, []);

  const doBulkSalvage = useCallback((itemIds: string[]) => {
    bulkSalvage(stateRef.current, itemIds);
  }, []);

  const doDismantleItem = useCallback((itemId: string): Essence[] => {
    return dismantleItem(stateRef.current, itemId);
  }, []);

  const doBulkDismantle = useCallback((itemIds: string[]): Essence[] => {
    return bulkDismantle(stateRef.current, itemIds);
  }, []);

  const doSlotEssence = useCallback((itemId: string, essenceId: string, slotIndex: number): boolean => {
    const success = slotEssence(stateRef.current, itemId, essenceId, slotIndex);
    if (success) {
      // Recalc if the item is equipped
      const isEquipped = Object.values(stateRef.current.equipment).some(e => e?.id === itemId);
      if (isEquipped) recalcDerived();
    }
    return success;
  }, [recalcDerived]);

  const doUpgradeEssence = useCallback((itemId: string, essenceId: string): boolean => {
    const success = upgradeEssence(stateRef.current, itemId, essenceId);
    if (success) {
      const isEquipped = Object.values(stateRef.current.equipment).some(e => e?.id === itemId);
      if (isEquipped) recalcDerived();
    }
    return success;
  }, [recalcDerived]);

  const doDiscardEssences = useCallback((filter: EssenceFilter): number => {
    return discardEssences(stateRef.current, filter);
  }, []);

  const doDeathRetreat = useCallback(() => {
    recalcDerived();
    handleDeathRetreat(stateRef.current, derivedRef.current);
  }, [recalcDerived]);

  const doDeathRetry = useCallback(() => {
    recalcDerived();
    handleDeathRetry(stateRef.current, derivedRef.current);
  }, [recalcDerived]);

  const dismissOfflineProgress = useCallback(() => {
    setOfflineProgress(null);
  }, []);

  const value: GameContextValue = {
    state: stateRef.current,
    derived: derivedRef.current,
    activePanel,
    setActivePanel,
    doAllocateStat,
    doAllocateStatMultiple,
    doResetAllStats,
    doEquipItem,
    doUnequipItem,
    doSellItem,
    doSalvageItem,
    doChangeZone,
    doStartCombat,
    doStopCombat,
    doResetGame,
    doStartEndlessRun,
    doEndEndlessRun,
    doToggleAutoSell,
    doToggleAutoSalvage,
    doToggleLock,
    doBulkSell,
    doBulkSalvage,
    doDismantleItem,
    doBulkDismantle,
    doSlotEssence,
    doUpgradeEssence,
    doDiscardEssences,
    doDeathRetreat,
    doDeathRetry,
    offlineProgress,
    dismissOfflineProgress,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export { GameContext };
