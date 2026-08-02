/**
 * ═══════════════════════════════════════════════════════════════════
 *  AppModeContext: Adaptive Engine for GymVault
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Manages the global [GYM_MODE] vs [HOME_MODE] state.
 *  Persists across restarts via AsyncStorage.
 *
 *  @typedef {'gym' | 'home'} AppMode
 *
 *  @typedef {Object} AppModeState
 *  @property {AppMode}   mode              - Current workout mode
 *  @property {string[]}  equipmentInventory - User's available home equipment
 *  @property {boolean}   isReady           - True once hydrated from storage
 *
 *  Exports:
 *    AppModeProvider: Wrap at root (App.js)
 *    useAppMode(): Hook to access mode + setMode + inventory controls
 */

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ────────────────────────────────────────────────
const STORAGE_KEY_MODE = '@gymvault_app_mode';
const STORAGE_KEY_INVENTORY = '@gymvault_equipment_inventory';

// ─── Equipment Catalog ───────────────────────────────────────────
export const HOME_EQUIPMENT_CATALOG = [
  { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
  { id: 'resistance_bands', label: 'Resistance Bands', icon: '🪢' },
  { id: 'pull_up_bar', label: 'Pull-Up Bar', icon: '🔩' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '🫎' },
  { id: 'yoga_mat', label: 'Yoga Mat', icon: '🧘' },
  { id: 'jump_rope', label: 'Jump Rope', icon: '🪢' },
  { id: 'bench', label: 'Adjustable Bench', icon: '🪑' },
  { id: 'foam_roller', label: 'Foam Roller', icon: '🧱' },
  { id: 'body_only', label: 'Bodyweight Only', icon: '💪' },
];

// ─── Exercise Swap Map (Gym → Home) ──────────────────────────────
export const EXERCISE_SWAP_MAP = {
  'lat pulldown':           { home: 'Resistance Band Lat Pulldown', equipment: 'resistance_bands' },
  'cable crossover':        { home: 'Resistance Band Crossover',    equipment: 'resistance_bands' },
  'cable fly':              { home: 'Resistance Band Fly',          equipment: 'resistance_bands' },
  'triceps pushdown':       { home: 'Overhead Tricep Extension (Band)', equipment: 'resistance_bands' },
  'leg press':              { home: 'Bulgarian Split Squat',        equipment: 'body_only' },
  'leg extension':          { home: 'Sissy Squat',                  equipment: 'body_only' },
  'leg curl':               { home: 'Nordic Hamstring Curl',        equipment: 'body_only' },
  'chest press machine':    { home: 'Push-Up Variations',           equipment: 'body_only' },
  'smith machine squat':    { home: 'Goblet Squat',                 equipment: 'kettlebell' },
  'cable row':              { home: 'Resistance Band Row',          equipment: 'resistance_bands' },
  'pec deck':               { home: 'Dumbbell Fly',                 equipment: 'dumbbells' },
  'hack squat':             { home: 'Pistol Squat',                 equipment: 'body_only' },
};

// ─── Context ─────────────────────────────────────────────────────
const AppModeContext = createContext(null);

export function AppModeProvider({ children }) {
  const [mode, setModeState] = useState('gym');
  const [equipmentInventory, setEquipmentState] = useState(['body_only']);
  const [isReady, setIsReady] = useState(false);

  // ── Hydrate from AsyncStorage on mount ──
  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedInventory] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_MODE),
          AsyncStorage.getItem(STORAGE_KEY_INVENTORY),
        ]);
        if (savedMode === 'home' || savedMode === 'gym') setModeState(savedMode);
        if (savedInventory) {
          const parsed = JSON.parse(savedInventory);
          if (Array.isArray(parsed) && parsed.length > 0) setEquipmentState(parsed);
        }
      } catch (e) {
        console.warn('[AppMode] Hydration error:', e.message);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  // ── Setters that persist ──
  const setMode = useCallback(async (newMode) => {
    setModeState(newMode);
    try { await AsyncStorage.setItem(STORAGE_KEY_MODE, newMode); } catch (_) {}
  }, []);

  const setEquipmentInventory = useCallback(async (inventory) => {
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    // Always include body_only
    if (!safeInventory.includes('body_only')) safeInventory.push('body_only');
    setEquipmentState(safeInventory);
    try { await AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(safeInventory)); } catch (_) {}
  }, []);

  const toggleEquipment = useCallback(async (equipmentId) => {
    setEquipmentState(prev => {
      const next = prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId && id !== 'body_only').concat('body_only') // keep body_only
        : [...prev, equipmentId];
      AsyncStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    mode,
    isGym: mode === 'gym',
    isHome: mode === 'home',
    equipmentInventory,
    isReady,
    setMode,
    setEquipmentInventory,
    toggleEquipment,
  }), [mode, equipmentInventory, isReady, setMode, setEquipmentInventory, toggleEquipment]);

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
}

// ─── Consumer Hook ───────────────────────────────────────────────
export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error('useAppMode must be used within <AppModeProvider>');
  return ctx;
}
