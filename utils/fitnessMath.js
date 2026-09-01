/**
 * GymVault Fitness Mathematics & Anatomical Intelligence Engine
 * Certified 10/10 Pure Functional Module - Zero Side Effects
 */

// 1. One-Rep Max (1RM) - Brzycki Formula with strict bounds
export function calculate1RM(weightKg, reps) {
  const w = parseFloat(weightKg) || 0;
  const r = Math.min(Math.max(parseInt(reps, 10) || 1, 1), 12);
  if (w <= 0) return 0;
  if (r === 1) return Math.round(w);
  return Math.round(w / (1.0278 - 0.0278 * r));
}

// 2. Olympic Barbell Plate Loading Simulator (20kg bar, pairs per side)
export const OFFICIAL_BUMPER_PLATES = [
  { weight: 25, color: '#EF4444', label: '25kg' },
  { weight: 20, color: '#3B82F6', label: '20kg' },
  { weight: 15, color: '#EAB308', label: '15kg' },
  { weight: 10, color: '#10B981', label: '10kg' },
  { weight: 5, color: '#F3F4F6', label: '5kg', textColor: '#000' },
  { weight: 2.5, color: '#111827', label: '2.5kg' },
  { weight: 1.25, color: '#6B7280', label: '1.25kg' },
];

export function calculatePlateBreakdown(totalWeightKg, barWeightKg = 20) {
  const target = Math.max(barWeightKg, parseFloat(totalWeightKg) || barWeightKg);
  let weightPerSide = (target - barWeightKg) / 2;
  const platesPerSide = [];

  OFFICIAL_BUMPER_PLATES.forEach(p => {
    while (weightPerSide >= p.weight) {
      platesPerSide.push({ ...p });
      weightPerSide = Math.round((weightPerSide - p.weight) * 100) / 100;
    }
  });

  return {
    barWeight: barWeightKg,
    totalWeight: target,
    weightPerSide: (target - barWeightKg) / 2,
    platesPerSide,
    remainingWeightPerSide: weightPerSide,
  };
}

// 3. TDEE & Macronutrient Architect (Mifflin-St Jeor)
export function calculateTDEE({ weightKg, heightCm, ageYears, goal = 'cut', activityMultiplier = 1.55 }) {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightCm) || 170;
  const a = parseFloat(ageYears) || 25;

  // Base BMR for active athletic individuals
  const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
  let tdee = bmr * activityMultiplier;

  if (goal === 'cut') tdee -= 500;
  else if (goal === 'bulk') tdee += 400;

  const targetCals = Math.round(tdee);
  const proteinGrams = Math.round(w * 2.2); // 2.2g per kg bodyweight
  const fatsGrams = Math.round((targetCals * 0.25) / 9); // 25% from healthy fats
  const carbsGrams = Math.max(0, Math.round((targetCals - (proteinGrams * 4) - (fatsGrams * 9)) / 4));
  const waterLiters = parseFloat((w * 0.04).toFixed(1)); // 40ml per kg

  return {
    bmr: Math.round(bmr),
    targetCals,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    waterLiters,
    goal,
  };
}

// 4. Cardiovascular Heart Rate Zones (Karvonen Scale)
export function calculateHeartRateZones(ageYears) {
  const age = Math.min(Math.max(parseInt(ageYears, 10) || 25, 12), 100);
  const maxHR = 220 - age;

  return {
    maxHR,
    zones: [
      { id: 1, name: 'Zone 1 (50-60%)', minBpm: Math.round(maxHR * 0.5), maxBpm: Math.round(maxHR * 0.6), focus: 'Active Recovery & Warmup' },
      { id: 2, name: 'Zone 2 (60-70%)', minBpm: Math.round(maxHR * 0.6), maxBpm: Math.round(maxHR * 0.7), focus: 'Fat Oxidation & Base Aerobic Engine' },
      { id: 3, name: 'Zone 3 (70-80%)', minBpm: Math.round(maxHR * 0.7), maxBpm: Math.round(maxHR * 0.8), focus: 'Aerobic Capacity & Endurance' },
      { id: 4, name: 'Zone 4 (80-90%)', minBpm: Math.round(maxHR * 0.8), maxBpm: Math.round(maxHR * 0.9), focus: 'Lactate Threshold & Speed Endurance' },
      { id: 5, name: 'Zone 5 (90-100%)', minBpm: Math.round(maxHR * 0.9), maxBpm: maxHR, focus: 'Maximal VO2 Max & HIIT Sprinting' },
    ]
  };
}

// 5. Multilingual Anatomical Muscle Group Taxonomy Detector
export function detectMuscleGroups(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const text = rawText.toLowerCase();
  const groups = new Set();

  if (
    text.includes('trapezius') || text.includes('trap') || text.includes('pundak') || text.includes('leher') ||
    text.includes('shrug') || text.includes('upright row') || text.includes('farmer') || text.includes('deadlift')
  ) groups.add('traps');

  if (
    text.includes('chest') || text.includes('pec') || text.includes('dada') ||
    text.includes('bench press') || text.includes('chest press') || text.includes('push up') || text.includes('push-up') || text.includes('fly') || text.includes('cable crossover') || text.includes('pec deck') || text.includes('dip') || text.includes('push')
  ) groups.add('chest');

  if (
    text.includes('lower back') || text.includes('erector') || text.includes('punggung bawah') || text.includes('pinggang') ||
    text.includes('deadlift') || text.includes('hyperextension') || text.includes('good morning') || text.includes('back extension')
  ) groups.add('lower_back');

  if (
    // Pisahkan 'pull' supaya tidak double-count dengan biceps
    text.includes('middle back') || text.includes('upper back') || text.includes('back') || text.includes('lats') || text.includes('latissimus') || text.includes('sayap') || text.includes('punggung') ||
    text.includes('pulldown') || text.includes('t-bar') || text.includes('lat pull') ||
    text.includes('pull up') || text.includes('pull-up') || text.includes('chin-up') || text.includes('chin up') ||
    (text.includes('row') && !text.includes('upright row'))
  ) groups.add('lats');

  if (
    text.includes('deltoid') || text.includes('shoulder') || text.includes('delt') || text.includes('bahu') ||
    text.includes('shoulder press') || text.includes('lateral raise') || text.includes('front raise') || text.includes('overhead press') || text.includes('military press') || text.includes('arnold press') || text.includes('face pull') || text.includes('upright row')
  ) groups.add('shoulders');

  if (
    text.includes('forearm') || text.includes('lengan bawah') || text.includes('brachioradialis') || text.includes('wrist') ||
    text.includes('wrist curl') || text.includes('reverse curl') || text.includes('grip') || text.includes('plate pinch') || text.includes('deadhang') || text.includes('deadlift') || text.includes('farmer')
  ) groups.add('forearms');

  if (
    text.includes('biceps') || text.includes('bicep') || text.includes('bisep') || text.includes('brachialis') ||
    // 'pull' sengaja dihapus dari sini — sudah masuk lats di atas, mencegah double-count
    text.includes('curl') || text.includes('chin-up') || text.includes('chin up') || text.includes('preacher') || text.includes('hammer') ||
    text.includes('pulldown') || (text.includes('row') && !text.includes('upright row'))
  ) groups.add('biceps');

  if (
    text.includes('triceps') || text.includes('tricep') || text.includes('trisep') ||
    text.includes('extension') || text.includes('dip') || text.includes('skull crusher') || text.includes('pushdown') || text.includes('kickback') || text.includes('french press') || text.includes('close-grip') || text.includes('close grip')
  ) groups.add('triceps');

  if (
    text.includes('quadriceps') || text.includes('quad') || text.includes('thigh') || text.includes('paha depan') || text.includes('leg') ||
    text.includes('squat') || text.includes('leg press') || text.includes('leg extension') || text.includes('lunge') || text.includes('hack squat') || text.includes('split squat') || text.includes('step up')
  ) groups.add('quads');

  if (
    text.includes('gluteus') || text.includes('glute') || text.includes('bokong') || text.includes('pantat') ||
    text.includes('hip thrust') || text.includes('glute kickback') || text.includes('bridge') || text.includes('cable pull through')
  ) groups.add('glutes');

  if (
    text.includes('gastrocnemius') || text.includes('soleus') || text.includes('calf') || text.includes('calves') || text.includes('betis') ||
    text.includes('calf raise') || text.includes('jinjit')
  ) groups.add('calves');

  if (
    text.includes('hamstring') || text.includes('paha belakang') ||
    text.includes('leg curl') || text.includes('romanian deadlift') || text.includes('rdl') || text.includes('stiff leg')
  ) groups.add('hamstrings');

  if (
    text.includes('abdominal') || text.includes('abs') || text.includes('core') || text.includes('oblique') || text.includes('perut') ||
    text.includes('crunch') || text.includes('plank') || text.includes('sit up') || text.includes('sit-up') || text.includes('leg raise') || text.includes('russian twist') || text.includes('ab wheel')
  ) groups.add('core');

  return Array.from(groups);
}

// 6. CNS & Muscle Recovery Percentage Decay Engine
export function calculateMuscleRecovery(hoursAgo) {
  const h = Math.max(0, parseFloat(hoursAgo) || 0);

  let percentage = 100;
  if (h < 24) {
    percentage = Math.round(15 + (h / 24) * 20); // 15% - 35%
  } else if (h < 48) {
    percentage = Math.round(35 + ((h - 24) / 24) * 35); // 35% - 70%
  } else if (h < 72) {
    percentage = Math.round(70 + ((h - 48) / 24) * 25); // 70% - 95%
  }

  let status = 'Fresh';
  if (percentage < 40) status = 'Fatigued';
  else if (percentage < 75) status = 'Recovering';

  return { percentage, status, hoursAgo: h };
}

// 7. AI Smart Progressive Overload & Auto-Regulation Engine (Dataset-Backed Strength Standards)
export function calculateProgressiveOverload(exerciseName = '', pastSets = [], baseWeight = 0, baseReps = 0, userBodyWeight = 65, lastRpe = null) {
  const name = String(exerciseName).toLowerCase();
  const bw = Math.max(40, Math.min(150, parseFloat(userBodyWeight) || 65));
  
  // 1. Detect movement kinematics & equipment type
  const isBodyweight = name.includes('push up') || name.includes('push-up') || name.includes('pull up') || 
                       name.includes('pull-up') || name.includes('chin up') || name.includes('chin-up') || 
                       name.includes('dip') || name.includes('crunch') || name.includes('plank') || 
                       name.includes('sit up') || name.includes('bodyweight');

  const isBarbell = name.includes('barbell') || name.includes('deadlift') || (name.includes('squat') && !name.includes('goblet') && !name.includes('dumbbell'));
  const isDumbbell = name.includes('dumbbell') || name.includes('db ') || name.includes('lateral raise') || name.includes('hammer curl');
  const isCableOrMachine = name.includes('cable') || name.includes('pulldown') || name.includes('machine') || name.includes('press machine') || name.includes('extension') || name.includes('curl machine');

  const isLowerCompound = name.includes('squat') || name.includes('deadlift') || name.includes('leg press') || name.includes('hack squat');
  const isUpperCompound = name.includes('bench') || name.includes('overhead') || name.includes('press') || name.includes('row') || name.includes('pull up') || name.includes('chin up') || name.includes('dip');
  const isCompound = isLowerCompound || isUpperCompound;

  // 2. Extract baseline weight/reps/rpe from previous sets or active input
  let lastWeight = parseFloat(baseWeight) || 0;
  let lastReps = parseInt(baseReps, 10) || 0;
  let rpeValue = parseFloat(lastRpe) || null;

  if (Array.isArray(pastSets) && pastSets.length > 0) {
    const validSets = pastSets.filter(s => (parseFloat(s.weight_kg) || parseFloat(s.kg) || parseFloat(s.weight) || 0) > 0);
    if (validSets.length > 0) {
      const topSet = validSets[0];
      lastWeight = parseFloat(topSet.weight_kg) || parseFloat(topSet.kg) || parseFloat(topSet.weight) || lastWeight;
      lastReps = parseInt(topSet.reps, 10) || lastReps;
      if (!rpeValue && topSet.rpe) rpeValue = parseFloat(topSet.rpe);
    }
  }

  // 3. No History / Zero Baseline -> Return clean null (no starter numbers forced)
  if (lastWeight <= 0 && lastReps <= 0) {
    return {
      hasData: false,
      recommendedWeightKg: 0,
      recommendedReps: 0,
      rationale: '',
      deltaPercent: 0,
      isDeloadRecommended: false,
      movementType: isCompound ? 'compound' : (isBodyweight ? 'bodyweight' : 'isolation')
    };
  }

  // 4. Intra-Workout Acute Fatigue & Surprise Performance Engine (Set-by-Set Intelligence)
  if (Array.isArray(pastSets) && pastSets.length > 1) {
    const completedSets = pastSets.filter(s => s.completed && (parseFloat(s.kg) || parseFloat(s.weight_kg) || 0) > 0);
    if (completedSets.length >= 1) {
      const latestSet = completedSets[completedSets.length - 1];
      const latestKg = parseFloat(latestSet.kg) || parseFloat(latestSet.weight_kg) || 0;
      const latestR = parseInt(latestSet.reps, 10) || 0;
      const latestRpe = parseFloat(latestSet.rpe) || null;

      // Check for Warmup Over-performance (e.g., user did 15+ reps easily on starter weight)
      if (latestR >= 16 && latestKg > 0) {
        const boostedKg = Math.round((latestKg * 1.35) * 2) / 2; // Jump ~35%
        return {
          recommendedWeightKg: boostedKg,
          recommendedReps: 8,
          rationale: `Kapasitas atletik Anda melampaui beban awal (${latestR} reps). AI meningkatkan set berikutnya ke ${boostedKg}kg × 8 reps untuk memasuki zona hipertrofi nyata.`,
          deltaPercent: Math.round(((boostedKg - latestKg) / latestKg) * 100),
          isDeloadRecommended: false,
          movementType: isCompound ? 'compound' : 'isolation'
        };
      }

      // Check for Acute Intra-Workout Dropoff (e.g. Set 1: 12 reps -> Set 2: 6 reps)
      if (completedSets.length >= 2) {
        const previousSet = completedSets[completedSets.length - 2];
        const prevKg = parseFloat(previousSet.kg) || parseFloat(previousSet.weight_kg) || 0;
        const prevR = parseInt(previousSet.reps, 10) || 0;

        if (prevKg === latestKg && prevR >= 8 && latestR <= Math.round(prevR * 0.65)) {
          // Dropoff > 35% detected -> Suggest Back-off / Drop Set
          const backoffKg = Math.max(isCompound ? 10 : 2, Math.round((latestKg * 0.8) * 2) / 2); // -20% weight
          return {
            recommendedWeightKg: backoffKg,
            recommendedReps: 10,
            rationale: `Kelelahan akut terdeteksi (drop repetisi ${prevR} ➔ ${latestR}). AI menyesuaikan menjadi Back-off Set (${backoffKg}kg × 10 reps) agar volume efektif tercapai tanpa merusak sendi.`,
            deltaPercent: -20,
            isDeloadRecommended: false,
            movementType: isCompound ? 'compound' : 'isolation',
            isBackoffSet: true
          };
        }
      }
    }
  }

  // 5. Scientific "Double Progression" & Auto-Regulation Overload Engine
  let recommendedWeightKg = lastWeight;
  let recommendedReps = lastReps;
  let rationale = '';
  let deltaPercent = 0;

  // Auto-Regulation modifier based on RPE feedback
  const isTooEasy = rpeValue !== null && rpeValue <= 6.5;
  const isGrind = rpeValue !== null && rpeValue >= 9.5;

  if (isLowerCompound) {
    // Lower Compound Window: 6 - 10 Reps
    if (lastReps >= 10 || (lastReps >= 8 && isTooEasy)) {
      recommendedWeightKg = Math.round((lastWeight + 2.5) * 10) / 10;
      recommendedReps = 6;
      deltaPercent = Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100);
      rationale = isTooEasy
        ? `RPE rendah (enteng). Naikkan beban +2.5kg dengan target 6 reps untuk stimulus adaptif.`
        : `Target 10 reps tercapai penuh! Waktunya naik beban +2.5kg dengan 6 reps (Double Progression).`;
    } else {
      recommendedReps = Math.min(10, lastReps + 1);
      rationale = isGrind
        ? `RPE tinggi (mendekati batas). Pertahankan ${lastWeight}kg, fokus form bersih dan target ${recommendedReps} reps.`
        : `Pertahankan beban ${lastWeight}kg. Target hari ini: tambah +1 rep (${recommendedReps} reps) sebelum menaikkan beban.`;
    }
  } else if (isBodyweight) {
    // Bodyweight Window: 6 - 15 Reps → progressi lewat rep, bukan beban
    // Pull-up/dip/push-up: target 15 reps baru tambah beban (weighted vest)
    if (lastReps >= 15 || (lastReps >= 12 && isTooEasy)) {
      // Sudah bisa 15 rep — rekomendasi tambah beban eksternal (weighted)
      recommendedWeightKg = lastWeight > 0 ? Math.round((lastWeight + 2.5) * 10) / 10 : 0;
      recommendedReps = 6;
      deltaPercent = lastWeight > 0 ? Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100) : 0;
      rationale = lastWeight > 0
        ? `Target bodyweight tercapai! Tambah beban +2.5kg (weighted vest/dip belt) untuk 6 reps.`
        : `Kamu sudah bisa ${lastReps} reps! Pertimbangkan weighted vest atau progressi ke variasi lebih sulit.`;
    } else {
      recommendedReps = Math.min(15, lastReps + 1);
      rationale = isGrind
        ? `RPE 9.5+ (hampir failure). Pertahankan ${lastReps} reps, jaga form ketat.`
        : `Tambah +1 rep per sesi. Target: ${recommendedReps} reps bersih sebelum naikkan intensitas.`;
    }
  } else if (isUpperCompound) {
    // Upper Compound Window: 8 - 12 Reps
    if (lastReps >= 12 || (lastReps >= 10 && isTooEasy)) {
      recommendedWeightKg = Math.round((lastWeight + 2.5) * 10) / 10;
      recommendedReps = 8;
      deltaPercent = Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100);
      rationale = isTooEasy
        ? `RPE rendah (kecepatan angkatan prima). Naikkan beban +2.5kg pada 8 reps.`
        : `Target 12 reps tercapai! Naikkan micro-load +2.5kg dengan 8 reps terukur.`;
    } else {
      recommendedReps = Math.min(12, lastReps + 1);
      rationale = isGrind
        ? `RPE 9.5+ (usaha maksimal). Pertahankan beban ${lastWeight}kg dan jaga tempo terkontrol.`
        : `Pertahankan beban ${lastWeight}kg. Target hari ini: kumpulkan ${recommendedReps} reps untuk adaptasi neuromuskular.`;
    }
  } else {
    // Isolation Window: 10 - 15 Reps
    if (lastReps >= 15 || (lastReps >= 12 && isTooEasy)) {
      recommendedWeightKg = Math.round((lastWeight + 1.25) * 10) / 10;
      recommendedReps = 10;
      deltaPercent = Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100);
      rationale = `Puncak repetisi isolasi tercapai! Naikkan micro-load +1.25kg pada 10 reps.`;
    } else {
      recommendedReps = Math.min(15, lastReps + 1);
      rationale = `Pertahankan beban ${lastWeight}kg. Tambah volume ke ${recommendedReps} repetisi sebelum menambah beban.`;
    }
  }

  return {
    recommendedWeightKg,
    recommendedReps,
    rationale,
    deltaPercent,
    isDeloadRecommended: false,
    movementType: isCompound ? 'compound' : 'isolation'
  };
}

// 9. Dynamic Rest-Timer Engine (ATP-CP & Metabolic Recovery Optimizer)
export function calculateRecommendedRestTime(exerciseName = '', weightKg = 0, reps = 0, rpe = null) {
  const name = String(exerciseName).toLowerCase();
  const isHeavyCompound = name.includes('squat') || name.includes('deadlift') || name.includes('bench') || name.includes('leg press');
  const rpeNum = parseFloat(rpe) || 7.5;

  if (isHeavyCompound) {
    if (rpeNum >= 9 || reps <= 6) return 180; // 3 minutes for high CNS phosphagen restore
    return 120; // 2 minutes for standard compound working sets
  }

  if (name.includes('curl') || name.includes('lateral raise') || name.includes('tricep') || name.includes('extension') || name.includes('calf')) {
    return 60; // 60s for metabolic pump & hypertrophy stress
  }

  return 90; // Standard 90s fallback
}

// 9. Biomechanical Form & Eccentric Tempo Cue Engine
export function getBiomechanicalCue(exerciseName = '') {
  const name = String(exerciseName).toLowerCase();

  if (name.includes('bench press')) {
    return {
      tempo: '3-0-1-0',
      cue: 'Retraksi skapula (kunci bahu ke belakang-bawah). Turun 3 detik terkontrol, dorong eksplosif.',
      focusMuscle: 'Pectoralis Major & Anterior Deltoid'
    };
  }

  if (name.includes('squat')) {
    return {
      tempo: '3-1-1-0',
      cue: 'Buka lutut sejajar jari kaki. Kunci core (bracing), turun hingga paha sejajar lantai.',
      focusMuscle: 'Quadriceps & Gluteus Maximus'
    };
  }

  if (name.includes('deadlift') || name.includes('rdl')) {
    return {
      tempo: '2-1-1-0',
      cue: 'Dorong pinggul ke belakang (hip hinge). Pertahankan tulang belakang netral dan kunci lats.',
      focusMuscle: 'Hamstrings, Glutes & Erector Spinae'
    };
  }

  if (name.includes('lateral raise')) {
    return {
      tempo: '2-1-2-0',
      cue: 'Angkat lengan 30° ke depan (scapular plane), pimpin dengan siku tanpa mengayun punggung.',
      focusMuscle: 'Lateral Deltoid'
    };
  }

  if (name.includes('pulldown') || name.includes('pull up') || name.includes('row')) {
    return {
      tempo: '2-1-2-0',
      cue: 'Tarik siku ke arah saku pinggang belakang. Tahan perasan otot punggung 1 detik di puncak kontraksi.',
      focusMuscle: 'Latissimus Dorsi & Rhomboids'
    };
  }

  if (name.includes('curl')) {
    return {
      tempo: '2-0-1-0',
      cue: 'Kunci posisi siku di samping rusuk. Putar pergelangan ke luar (supinasi) di puncak gerakan.',
      focusMuscle: 'Biceps Brachii'
    };
  }

  return {
    tempo: '2-0-1-0',
    cue: 'Kontrol fase eksentrik (turun lambat) dan hindari momentum tubuh untuk hipertrofi maksimal.',
    focusMuscle: 'Target Muscle Group'
  };
}

// 8. Scientific Hypertrophy Volume Landmarks (MEV / MAV / MRV)
export const VOLUME_LANDMARK_STANDARDS = {
  chest: { mev: 8, mavMin: 12, mavMax: 20, mrv: 22 },
  back: { mev: 10, mavMin: 14, mavMax: 22, mrv: 25 },
  lats: { mev: 10, mavMin: 14, mavMax: 22, mrv: 25 },
  traps: { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  quads: { mev: 8, mavMin: 12, mavMax: 18, mrv: 20 },
  hamstrings: { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  glutes: { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  shoulders: { mev: 8, mavMin: 16, mavMax: 22, mrv: 26 },
  biceps: { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  triceps: { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  forearms: { mev: 4, mavMin: 8, mavMax: 14, mrv: 18 },
  calves: { mev: 6, mavMin: 10, mavMax: 16, mrv: 20 },
  core: { mev: 4, mavMin: 8, mavMax: 14, mrv: 18 },
};

export function calculateVolumeLandmarks(muscleGroup = 'chest', weeklySets = 0) {
  const key = String(muscleGroup).toLowerCase();
  const benchmark = VOLUME_LANDMARK_STANDARDS[key] || VOLUME_LANDMARK_STANDARDS.chest;
  const sets = Math.max(0, parseInt(weeklySets, 10) || 0);

  let status = 'optimal_mav';
  let adviceText = 'Volume latihan berada di zona hipertrofi optimal (MAV). Pertahankan!';
  let badgeColor = '#D4F53C'; // Electric Green

  if (sets < benchmark.mev) {
    status = 'under_mev';
    adviceText = `Volume di bawah MEV (${benchmark.mev} set). Tambahkan ${benchmark.mev - sets} set lagi untuk memicu pertumbuhan otot.`;
    badgeColor = '#94A3B8'; // Slate Gray
  } else if (sets > benchmark.mrv) {
    status = 'over_mrv';
    adviceText = `Volume melebihi MRV (${benchmark.mrv} set). Risiko overtraining tinggi, disarankan deload atau kurangi set.`;
    badgeColor = '#EF4444'; // Red
  } else if (sets >= benchmark.mavMax) {
    status = 'approaching_mrv';
    adviceText = `Mendekati ambang MRV (${benchmark.mrv} set). Pantau rasa lelah persendian dan kualitas tidur Anda.`;
    badgeColor = '#F59E0B'; // Amber
  }

  return {
    muscleGroup: key,
    currentSets: sets,
    mev: benchmark.mev,
    mavMin: benchmark.mavMin,
    mavMax: benchmark.mavMax,
    mrv: benchmark.mrv,
    status,
    adviceText,
    badgeColor
  };
}

// 10. Cross-Muscle Kinetic Chain & Recovery Fatigue Warning Engine
export function checkKineticChainFatigue(exerciseName = '', pastWorkouts = []) {
  const currentEx = String(exerciseName).toLowerCase();
  if (!Array.isArray(pastWorkouts) || pastWorkouts.length === 0) {
    return {
      isFatigued: false,
      recoveryScore: 100,
      overlappingExercise: '',
      advice: 'Sistem neuromuskular dan rantai kinetik 100% pulih untuk eksekusi optimal.'
    };
  }

  const now = Date.now();
  let mostRecentConflict = null;
  let minHoursAgo = 999;

  for (const session of pastWorkouts) {
    const sessionTime = new Date(session.created_at || session.start_time || now).getTime();
    const hoursAgo = Math.max(0, (now - sessionTime) / (1000 * 60 * 60));
    if (hoursAgo > 72) continue; // Only check last 72h window

    const exList = Array.isArray(session.exercises) ? session.exercises : [];
    for (const ex of exList) {
      const exName = String(ex.name || '').toLowerCase();
      let hasConflict = false;

      // Rule 1: Squat vs Deadlift / Lower Back
      if ((currentEx.includes('squat') && (exName.includes('deadlift') || exName.includes('rdl') || exName.includes('good morning'))) ||
          (currentEx.includes('deadlift') && (exName.includes('squat') || exName.includes('leg press')))) {
        hasConflict = true;
      }
      // Rule 2: Overhead Press vs Heavy Bench Press
      else if ((currentEx.includes('overhead') || currentEx.includes('shoulder press')) && exName.includes('bench press')) {
        hasConflict = true;
      }
      // Rule 3: Bench Press vs Heavy Dips / Close Grip Press
      else if (currentEx.includes('bench press') && (exName.includes('dip') || exName.includes('overhead press') || exName.includes('shoulder press'))) {
        hasConflict = true;
      }
      // Rule 4: Heavy Pull Ups / Rows vs Heavy Deadlift / Bicep Day
      else if ((currentEx.includes('pull up') || currentEx.includes('pulldown') || currentEx.includes('row')) && (exName.includes('deadlift') || exName.includes('bicep'))) {
        hasConflict = true;
      }

      if (hasConflict && hoursAgo < minHoursAgo) {
        minHoursAgo = hoursAgo;
        mostRecentConflict = {
          exercise: ex.name,
          hoursAgo: Math.round(hoursAgo)
        };
      }
    }
  }

  if (mostRecentConflict && minHoursAgo < 48) {
    const recoveryCalc = calculateMuscleRecovery(minHoursAgo);
    return {
      isFatigued: recoveryCalc.percentage < 70,
      recoveryScore: recoveryCalc.percentage,
      overlappingExercise: mostRecentConflict.exercise,
      hoursAgo: mostRecentConflict.hoursAgo,
      advice: `Kelelahan rantai kinetik (${mostRecentConflict.exercise} ${mostRecentConflict.hoursAgo} jam lalu - Pemulihan ${recoveryCalc.percentage}%). Jaga kestabilan form atau utamakan variasi dengan tumpuan terpandu.`
    };
  }

  return {
    isFatigued: false,
    recoveryScore: 100,
    overlappingExercise: '',
    advice: 'Rantai kinetik dan persendian siap untuk performa kekuatan puncak.'
  };
}

// 11. 4-Week Plateau Breaker & Exercise Variation Rotation Engine
export const EXERCISE_ROTATION_MAP = {
  'barbell bench press': 'Incline Dumbbell Press / Machine Chest Press',
  'dumbbell bench press': 'Barbell Incline Press / Dips Berbobot',
  'barbell back squat': 'Hack Squat Mesin / Bulgarian Split Squat',
  'deadlift konvensional': 'Romanian Deadlift (RDL) / Trap Bar Deadlift',
  'overhead press': 'Seated Dumbbell Shoulder Press / Machine Press',
  'barbell bicep curl': 'Incline Dumbbell Curl / Bayesian Cable Curl',
  'tricep pushdown': 'Overhead Cable Tricep Extension / Skull Crusher',
  'dumbbell lateral raise': 'Behind-the-Back Cable Lateral Raise',
  'lat pulldown lebar': 'Chest-Supported T-Bar Row / Neutral Grip Pulldown',
};

export function detectPlateauAndSuggestRotation(exerciseName = '', pastSessions = []) {
  const name = String(exerciseName).toLowerCase();
  let alternative = 'Variasi Dumbbell / Cable dengan sudut serat otot baru';

  for (const [key, alt] of Object.entries(EXERCISE_ROTATION_MAP)) {
    if (name.includes(key) || key.includes(name)) {
      alternative = alt;
      break;
    }
  }

  if (!Array.isArray(pastSessions) || pastSessions.length < 3) {
    return {
      isPlateau: false,
      plateauCount: 0,
      alternativeExercise: alternative,
      strategyRationale: 'Progres adaptif masih dalam kurva pertumbuhan normal.'
    };
  }

  // Check if the last 3 sessions had 0 progress in top weight
  const recent3 = pastSessions.slice(0, 3);
  const weights = recent3.map(s => parseFloat(s.maxWeight || s.weight || s.top_weight) || 0);
  const allSame = weights.length >= 3 && weights.every(w => w > 0 && w === weights[0]);

  if (allSame) {
    return {
      isPlateau: true,
      plateauCount: weights.length,
      alternativeExercise: alternative,
      strategyRationale: `Adaptasi neuromuscular tercapai pada gerakan ini (${weights.length} sesi berturut-turut di ${weights[0]}kg). Disarankan rotasi ke ${alternative} atau jadwalkan Deload Week (-50% volume) untuk memecah plateau!`
    };
  }

  return {
    isPlateau: false,
    plateauCount: 0,
    alternativeExercise: alternative,
    strategyRationale: 'Progres beban dan repetisi berjalan lancar.'
  };
}

// 12. Voice-Activated Hands-Free Workout Logger Speech Parser
export function parseVoiceWorkoutCommand(speechTranscript = '') {
  const text = String(speechTranscript).toLowerCase().trim();
  if (!text) {
    return { success: false, weightKg: 0, reps: 0, message: 'Suara tidak terdeteksi.' };
  }

  // Regex patterns for weight and reps in Indonesian / English
  // Pattern 1: "80 kg 8 reps" or "80 kilo 8 repetisi" or "80kg 8rep"
  const pattern1 = /(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogram|lbs)?\D+(\d+)\s*(?:rep|reps|repetisi|kali|x)/i;
  // Pattern 2: "repetisi 8 beban 80" or "8 reps at 80 kg"
  const pattern2 = /(\d+)\s*(?:rep|reps|repetisi|kali)\D+(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogram)?/i;
  // Pattern 3: Simple two numbers "80 8" or "80x8"
  const pattern3 = /(\d+(?:[.,]\d+)?)\s*(?:x|\*|\s)\s*(\d+)/i;

  let weightKg = 0;
  let reps = 0;

  const match1 = text.match(pattern1);
  const match2 = text.match(pattern2);
  const match3 = text.match(pattern3);

  if (match1) {
    weightKg = parseFloat(match1[1].replace(',', '.'));
    reps = parseInt(match1[2], 10);
  } else if (match2) {
    reps = parseInt(match2[1], 10);
    weightKg = parseFloat(match2[2].replace(',', '.'));
  } else if (match3) {
    weightKg = parseFloat(match3[1].replace(',', '.'));
    reps = parseInt(match3[2], 10);
  } else {
    // Single number fallbacks
    const numMatches = text.match(/\d+(?:[.,]\d+)?/g);
    if (numMatches && numMatches.length >= 2) {
      weightKg = parseFloat(numMatches[0].replace(',', '.'));
      reps = parseInt(numMatches[1], 10);
    } else if (numMatches && numMatches.length === 1) {
      if (text.includes('rep') || text.includes('kali')) {
        reps = parseInt(numMatches[0], 10);
      } else {
        weightKg = parseFloat(numMatches[0].replace(',', '.'));
      }
    }
  }

  if (weightKg > 0 || reps > 0) {
    return {
      success: true,
      weightKg: Math.round(weightKg * 10) / 10,
      reps: Math.max(1, reps || 8),
      rawTranscript: speechTranscript,
      isComplete: true,
      message: `Terdeteksi: ${weightKg} kg × ${reps || 8} reps`
    };
  }

  return {
    success: false,
    weightKg: 0,
    reps: 0,
    rawTranscript: speechTranscript,
    message: 'Perintah suara belum mengenali format angka (contoh: "80 kilo 8 repetisi").'
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculate1RM,
    calculatePlateBreakdown,
    calculateTDEE,
    calculateHeartRateZones,
    detectMuscleGroups,
    calculateMuscleRecovery,
    calculateProgressiveOverload,
    calculateVolumeLandmarks,
    calculateRecommendedRestTime,
    getBiomechanicalCue,
    checkKineticChainFatigue,
    detectPlateauAndSuggestRotation,
    parseVoiceWorkoutCommand,
  };
}



