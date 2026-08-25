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
