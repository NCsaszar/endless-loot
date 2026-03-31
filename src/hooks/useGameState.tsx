import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, DerivedStats, Item, ActivePanel, Rarity, PrimaryStat } from '../types';
import { getTotalPrimaryStats, calculateDerivedStats } from '../data/formulas';
import { tick } from '../systems/gameLoop';
import { saveGame, loadGame, createDefaultState, calculateOfflineProgress } from '../systems/save';
import { sellItem, salvageItem, trainStat, equipItem, unequipItem, bulkSell, bulkSalvage } from '../systems/economy';
import { allocateStat, changeZone, startCombat, stopCombat } from '../systems/progression';
import { generateItem } from '../systems/loot';
import type { OfflineProgress } from '../systems/save';

interface GameContextValue {
  state: GameState;
  derived: DerivedStats;
  activePanel: ActivePanel;
  setActivePanel: (p: ActivePanel) => void;
  doAllocateStat: (stat: PrimaryStat) => void;
  doEquipItem: (item: Item) => void;
  doUnequipItem: (slot: Item['slot']) => void;
  doSellItem: (itemId: string) => void;
  doSalvageItem: (itemId: string) => void;
  doTrainStat: (stat: PrimaryStat) => void;
  doChangeZone: (zoneId: number) => void;
  doStartCombat: () => void;
  doStopCombat: () => void;
  doResetGame: () => void;
  doToggleAutoSell: (rarity: Rarity) => void;
  doToggleAutoSalvage: (rarity: Rarity) => void;
  doToggleLock: (itemId: string) => void;
  doBulkSell: (itemIds: string[]) => void;
  doBulkSalvage: (itemIds: string[]) => void;
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
    const primary = getTotalPrimaryStats(state.character, state.trainingLevels, state.equipment);
    primaryStatsRef.current = primary;
    derivedRef.current = calculateDerivedStats(primary, state.equipment);
    state.character.currentHp = Math.min(state.character.currentHp, derivedRef.current.maxHp);
    if (state.character.currentHp <= 0) state.character.currentHp = derivedRef.current.maxHp;
  }

  const recalcDerived = useCallback(() => {
    const s = stateRef.current;
    const primary = getTotalPrimaryStats(s.character, s.trainingLevels, s.equipment);
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

      // Auto-save every 30s
      saveTimerRef.current += dt;
      if (saveTimerRef.current >= 30) {
        saveTimerRef.current = 0;
        saveGame(stateRef.current);
      }

      forceUpdate(n => n + 1);
      frameId = requestAnimationFrame(loop);
    };

    let frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
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

  const doEquipItem = useCallback((item: Item) => {
    equipItem(stateRef.current, item);
    recalcDerived();
  }, [recalcDerived]);

  const doUnequipItem = useCallback((slot: Item['slot']) => {
    unequipItem(stateRef.current, slot);
    recalcDerived();
  }, [recalcDerived]);

  const doSellItem = useCallback((itemId: string) => {
    sellItem(stateRef.current, itemId);
  }, []);

  const doSalvageItem = useCallback((itemId: string) => {
    salvageItem(stateRef.current, itemId);
  }, []);

  const doTrainStat = useCallback((stat: PrimaryStat) => {
    trainStat(stateRef.current, stat);
    recalcDerived();
  }, [recalcDerived]);

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

  const dismissOfflineProgress = useCallback(() => {
    setOfflineProgress(null);
  }, []);

  const value: GameContextValue = {
    state: stateRef.current,
    derived: derivedRef.current,
    activePanel,
    setActivePanel,
    doAllocateStat,
    doEquipItem,
    doUnequipItem,
    doSellItem,
    doSalvageItem,
    doTrainStat,
    doChangeZone,
    doStartCombat,
    doStopCombat,
    doResetGame,
    doToggleAutoSell,
    doToggleAutoSalvage,
    doToggleLock,
    doBulkSell,
    doBulkSalvage,
    offlineProgress,
    dismissOfflineProgress,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export { GameContext };
