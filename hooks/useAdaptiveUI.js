/**
 * ═══════════════════════════════════════════════════════════════════
 *  useAdaptiveUI: Adaptive UI Engine Hook
 * ═══════════════════════════════════════════════════════════════════
 *
 *  This hook consumes AppModeContext and provides:
 *   • Feature visibility flags (show/hide gym-only features)
 *   • Exercise name swapping (gym → home alternatives)
 *   • Adaptive measurement labels
 *   • Equipment-based exercise filtering
 *
 *  Usage:
 *    const { adaptExercise, shouldShow, labels, filterForMode } = useAdaptiveUI();
 */

import { useMemo, useCallback } from 'react';
import { useAppMode, EXERCISE_SWAP_MAP } from '../contexts/AppModeContext';

// Equipment types mapped to our inventory IDs
const EQUIPMENT_TO_INVENTORY = {
  'barbell': 'barbell',
  'dumbbell': 'dumbbells',
  'dumbbells': 'dumbbells',
  'cable': 'cable',
  'machine': 'machine',
  'kettlebells': 'kettlebell',
  'kettlebell': 'kettlebell',
  'e-z curl bar': 'ez_curl_bar',
  'bands': 'resistance_bands',
  'resistance bands': 'resistance_bands',
  'body only': 'body_only',
  'none': 'body_only',
  'exercise ball': 'yoga_mat',
  'foam roll': 'foam_roller',
};

export function useAdaptiveUI() {
  const { mode, isGym, isHome, equipmentInventory } = useAppMode();

  // ── Feature Visibility ──────────────────────────────────────────
  const shouldShow = useMemo(() => ({
    nfcMachineTap: isGym,
    crowdRadar: isGym,
    cableMachineGuide: isGym,
    plateCalculator: isGym,
    homeTimer: isHome,
    bodyweightScaler: isHome,
    bandResistanceGuide: isHome && equipmentInventory.includes('resistance_bands'),
    equipmentSetup: isHome,
  }), [isGym, isHome, equipmentInventory]);

  // ── Measurement Labels ──────────────────────────────────────────
  const labels = useMemo(() => ({
    weightUnit: isGym ? 'kg' : 'reps',
    weightLabel: isGym ? 'Weight (kg)' : 'Intensity',
    repsLabel: isGym ? 'Reps' : 'Reps / Seconds',
    setHeader: isGym ? ['SET', 'KG', 'REPS', '✓'] : ['SET', 'LVL', 'REPS', '✓'],
    intensityOptions: isHome ? ['Light', 'Medium', 'Heavy', 'Max'] : null,
  }), [isGym, isHome]);

  // ── Exercise Adaptation ─────────────────────────────────────────
  const adaptExercise = useCallback((exerciseName) => {
    if (isGym) return { name: exerciseName, isSwapped: false, originalName: null };

    const lowerName = exerciseName.toLowerCase();
    for (const [gymKey, swap] of Object.entries(EXERCISE_SWAP_MAP)) {
      if (lowerName.includes(gymKey)) {
        // Check if user has the required equipment for the swap
        if (equipmentInventory.includes(swap.equipment)) {
          return { name: swap.home, isSwapped: true, originalName: exerciseName };
        }
      }
    }
    return { name: exerciseName, isSwapped: false, originalName: null };
  }, [isGym, equipmentInventory]);

  // ── Exercise List Filter (for Library) ──────────────────────────
  const filterForMode = useCallback((exercises) => {
    if (isGym) return exercises; // Full catalog

    return exercises.filter(ex => {
      const eqType = (ex.equipment_type || ex.equipment || '').toLowerCase();
      const inventoryId = EQUIPMENT_TO_INVENTORY[eqType] || null;

      // Always include bodyweight exercises
      if (!inventoryId || inventoryId === 'body_only') return true;

      // Include if user has this equipment
      return equipmentInventory.includes(inventoryId);
    });
  }, [isGym, equipmentInventory]);

  // ── Mode Descriptor ─────────────────────────────────────────────
  const modeInfo = useMemo(() => ({
    label: isGym ? 'Gym Mode' : 'Home Mode',
    icon: isGym ? '🏢' : '🏠',
    color: isGym ? '#CCFF00' : '#3B82F6',
    description: isGym
      ? 'Full equipment access. Weight-based tracking.'
      : 'Adapted for home equipment. Bodyweight-focused.',
  }), [isGym]);

  return {
    mode,
    isGym,
    isHome,
    shouldShow,
    labels,
    adaptExercise,
    filterForMode,
    modeInfo,
  };
}
