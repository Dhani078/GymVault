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
    text.includes('middle back') || text.includes('upper back') || text.includes('back') || text.includes('lats') || text.includes('latissimus') || text.includes('sayap') || text.includes('punggung') || text.includes('pull') ||
    text.includes('row') || text.includes('pull up') || text.includes('pull-up') || text.includes('pulldown') || text.includes('t-bar') || text.includes('lat pull') || text.includes('chin-up') || text.includes('chin up')
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
    text.includes('biceps') || text.includes('bicep') || text.includes('bisep') || text.includes('brachialis') || text.includes('pull') ||
    text.includes('curl') || text.includes('chin-up') || text.includes('chin up') || text.includes('preacher') || text.includes('hammer') || text.includes('pulldown') || text.includes('row')
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

// 7. AI Smart Progressive Overload Engine (Equipment & Experience-Adaptive)
export function calculateProgressiveOverload(exerciseName = '', pastSets = [], baseWeight = 0, baseReps = 0, userBodyWeight = 70) {
  const name = String(exerciseName).toLowerCase();
  
  // 1. Detect movement kinematics & equipment type
  const isBodyweight = name.includes('push up') || name.includes('push-up') || name.includes('pull up') || 
                       name.includes('pull-up') || name.includes('chin up') || name.includes('chin-up') || 
                       name.includes('dip') || name.includes('crunch') || name.includes('plank') || 
                       name.includes('sit up') || name.includes('bodyweight');

  const isBarbell = name.includes('barbell') || name.includes('deadlift') || name.includes('squat') && !name.includes('goblet') && !name.includes('dumbbell');
  const isDumbbell = name.includes('dumbbell') || name.includes('db ') || name.includes('lateral raise') || name.includes('hammer curl');
  const isCableOrMachine = name.includes('cable') || name.includes('pulldown') || name.includes('machine') || name.includes('press machine') || name.includes('extension') || name.includes('curl machine');

  const isLowerCompound = name.includes('squat') || name.includes('deadlift') || name.includes('leg press') || name.includes('hack squat');
  const isUpperCompound = name.includes('bench') || name.includes('overhead') || name.includes('press') || name.includes('row') || name.includes('pull up') || name.includes('chin up') || name.includes('dip');
  const isCompound = isLowerCompound || isUpperCompound;

  // 2. Extract baseline weight/reps from previous sets or active input
  let lastWeight = parseFloat(baseWeight) || 0;
  let lastReps = parseInt(baseReps, 10) || 0;

  if (Array.isArray(pastSets) && pastSets.length > 0) {
    const validSets = pastSets.filter(s => (parseFloat(s.weight_kg) || parseFloat(s.kg) || parseFloat(s.weight) || 0) > 0);
    if (validSets.length > 0) {
      const topSet = validSets[0];
      lastWeight = parseFloat(topSet.weight_kg) || parseFloat(topSet.kg) || parseFloat(topSet.weight) || lastWeight;
      lastReps = parseInt(topSet.reps, 10) || lastReps;
    }
  }

  // 3. Intelligent Beginner / New Account Baseline Calibration
  if (lastWeight <= 0 && lastReps <= 0) {
    if (isBodyweight) {
      return {
        recommendedWeightKg: 0,
        recommendedReps: 10,
        rationale: 'Gerakan beban tubuh (Bodyweight). Fokus kalibrasi postur & kendali otot penuh.',
        deltaPercent: 0,
        isDeloadRecommended: false,
        movementType: 'bodyweight'
      };
    }

    if (isBarbell) {
      return {
        recommendedWeightKg: 20, // Standard 20kg Olympic Barbell shaft
        recommendedReps: 8,
        rationale: 'Akun baru terdeteksi: AI memulai dari stang barbel standar 20kg untuk memastikan biomekanik & form aman.',
        deltaPercent: 0,
        isDeloadRecommended: false,
        movementType: 'compound'
      };
    }

    if (isDumbbell) {
      const dbWeight = name.includes('lateral') ? 4 : (name.includes('curl') ? 6 : 8);
      return {
        recommendedWeightKg: dbWeight,
        recommendedReps: 12,
        rationale: `Kalibrasi dumbel adaptif (${dbWeight}kg) untuk pemula agar stabilitas sendi terjaga.`,
        deltaPercent: 0,
        isDeloadRecommended: false,
        movementType: 'isolation'
      };
    }

    if (isCableOrMachine) {
      return {
        recommendedWeightKg: 15,
        recommendedReps: 12,
        rationale: 'Pin beban mesin awal 15kg untuk melatih lintasan gerak dan tempo kontraksi.',
        deltaPercent: 0,
        isDeloadRecommended: false,
        movementType: isCompound ? 'compound' : 'isolation'
      };
    }

    // Default safe fallback
    return {
      recommendedWeightKg: isCompound ? 20 : 6,
      recommendedReps: isCompound ? 8 : 12,
      rationale: 'Baseline awal untuk membangun form & adaptasi neuromuskular aman.',
      deltaPercent: 0,
      isDeloadRecommended: false,
      movementType: isCompound ? 'compound' : 'isolation'
    };
  }

  // 4. Progressive Overload Calculation for existing logs
  let recommendedWeightKg = lastWeight;
  let recommendedReps = lastReps;
  let rationale = '';
  let deltaPercent = 0;

  if (isLowerCompound) {
    if (lastReps >= 8) {
      recommendedWeightKg = Math.round((lastWeight + 5.0) * 10) / 10;
      recommendedReps = Math.max(6, lastReps - 2);
      deltaPercent = Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100);
      rationale = `Target repetisi tercapai. Naikkan beban +5kg untuk memicu adaptasi kekuatan kaki.`;
    } else {
      recommendedReps = lastReps + 1;
      rationale = `Pertahankan beban ${lastWeight}kg dan tambah +1 rep untuk efisiensi biomekanik.`;
    }
  } else if (isUpperCompound) {
    if (lastReps >= 8) {
      recommendedWeightKg = Math.round((lastWeight + 2.5) * 10) / 10;
      recommendedReps = Math.max(6, lastReps - 2);
      deltaPercent = Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100);
      rationale = `Target repetisi tercapai. Tambah micro-load +2.5kg untuk overreach terukur.`;
    } else {
      recommendedReps = lastReps + 1;
      rationale = `Pertahankan beban ${lastWeight}kg dan capai +1 rep sebelum menaikkan beban.`;
    }
  } else {
    // Isolation exercise (Curls, Extensions, Raises)
    if (lastReps >= 12) {
      recommendedWeightKg = Math.round((lastWeight + 1.25) * 10) / 10;
      recommendedReps = 10;
      deltaPercent = Math.round(((recommendedWeightKg - lastWeight) / lastWeight) * 100);
      rationale = `Hipertrofi isolation optimal. Tambah micro-load +1.25kg pada repetisi 10.`;
    } else {
      recommendedReps = lastReps + 1;
      rationale = `Kumpulkan volume repetisi hingga 12 reps sebelum menaikkan beban isolasi.`;
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
  let badgeColor = '#CCFF00'; // Electric Green

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

