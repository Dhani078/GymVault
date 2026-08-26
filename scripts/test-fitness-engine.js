/**
 * GymVault Certified 10/10 Automated Verification Test Suite
 * Run with: node scripts/test-fitness-engine.js
 */

const {
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
} = require('../utils/fitnessMath');

const {
  formatShortDate,
  formatFullWIBDate,
  formatTime24,
  isSameDay,
  getStartOfWeek
} = require('../utils/dateHelpers');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    failedTests++;
  }
}

console.log('\n========================================');
console.log('🚀 GYMVAULT 10/10 AUTOMATED TEST RUNNER');
console.log('========================================\n');

// Test Suite 1: 1RM Formulas
console.log('🧪 [Test Suite 1: 1-Rep Max (1RM)]');
assert(calculate1RM(100, 5) === 113, `100kg x 5 reps = 113kg (Brzycki) [Got: ${calculate1RM(100, 5)}]`);
assert(calculate1RM(100, 1) === 100, `100kg x 1 rep = 100kg [Got: ${calculate1RM(100, 1)}]`);
assert(calculate1RM(0, 5) === 0, `0kg x 5 reps = 0kg [Got: ${calculate1RM(0, 5)}]`);

// Test Suite 2: Plate Breakdown
console.log('\n🧪 [Test Suite 2: Olympic Plate Loading]');
const plateResult = calculatePlateBreakdown(100, 20);
assert(plateResult.weightPerSide === 40, `100kg barbell -> 40kg per side [Got: ${plateResult.weightPerSide}]`);
assert(plateResult.platesPerSide.length === 2, `40kg side = 25kg + 15kg (2 plates) [Got count: ${plateResult.platesPerSide.length}]`);
assert(plateResult.platesPerSide[0].weight === 25, `First plate is 25kg [Got: ${plateResult.platesPerSide[0]?.weight}]`);
assert(plateResult.platesPerSide[1].weight === 15, `Second plate is 15kg [Got: ${plateResult.platesPerSide[1]?.weight}]`);

// Test Suite 3: TDEE & Macros
console.log('\n🧪 [Test Suite 3: TDEE & Macronutrient Architect]');
const tdeeResult = calculateTDEE({ weightKg: 70, heightCm: 175, ageYears: 25, goal: 'cut' });
assert(tdeeResult.targetCals > 1800 && tdeeResult.targetCals < 2400, `70kg cut calories within reasonable range [Got: ${tdeeResult.targetCals} kcal]`);
assert(tdeeResult.proteinGrams === 154, `70kg protein = 154g (2.2g/kg) [Got: ${tdeeResult.proteinGrams}g]`);
assert(tdeeResult.waterLiters === 2.8, `70kg water intake = 2.8L (40ml/kg) [Got: ${tdeeResult.waterLiters}L]`);

// Test Suite 4: Heart Rate Zones
console.log('\n🧪 [Test Suite 4: Cardio HR Zones (Karvonen)]');
const hrResult = calculateHeartRateZones(25, 60);
assert(hrResult.maxHR === 195, `25yo max HR = 195 BPM [Got: ${hrResult.maxHR}]`);
assert(hrResult.zones.length === 5, `HR Zones count is 5 [Got: ${hrResult.zones.length}]`);
assert(hrResult.zones[1].name.includes('Zone 2'), `Zone 2 is present [Got: ${hrResult.zones[1]?.name}]`);

// Test Suite 5: Multilingual Muscle Taxonomy
console.log('\n🧪 [Test Suite 5: Multilingual Muscle Taxonomy]');
const detectedBack = detectMuscleGroups('Lat Pulldown Lebar');
assert(detectedBack.includes('lats'), `Detected 'lats' from Lat Pulldown [Got: ${detectedBack.join(', ')}]`);
assert(detectMuscleGroups('Incline Bicep Curl').includes('biceps'), `Detected 'biceps' from Incline Bicep Curl`);
assert(detectMuscleGroups('Deadlift Konvensional').includes('lower_back'), `Detected 'lower_back' from Deadlift`);
assert(detectMuscleGroups('Deadlift Konvensional').includes('traps'), `Detected 'traps' from Deadlift`);
assert(detectMuscleGroups('Bench Press').includes('chest'), `Detected 'chest' from Bench Press`);
assert(detectMuscleGroups('Lateral Raise').includes('shoulders'), `Detected 'shoulders' from Lateral Raise`);
assert(detectMuscleGroups('Tricep Pushdown').includes('triceps'), `Detected 'triceps' from Pushdown`);

// Test Suite 6: Muscle Recovery Decay
console.log('\n🧪 [Test Suite 6: CNS Muscle Recovery Decay]');
const rec2h = calculateMuscleRecovery(2);
assert(rec2h.status === 'Fatigued' && rec2h.percentage <= 35, `2 hours ago = Fatigued (<=35%) [Got: ${rec2h.status} ${rec2h.percentage}%]`);
const rec36h = calculateMuscleRecovery(36);
assert(rec36h.status === 'Recovering' && rec36h.percentage > 35 && rec36h.percentage < 70, `36 hours ago = Recovering (35-70%) [Got: ${rec36h.status} ${rec36h.percentage}%]`);
const rec80h = calculateMuscleRecovery(80);
assert(rec80h.status === 'Fresh' && rec80h.percentage === 100, `80 hours ago = Fresh (100%) [Got: ${rec80h.status} ${rec80h.percentage}%]`);

// Test Suite 7: Date & Time Standardization (WIB)
console.log('\n🧪 [Test Suite 7: Date & Time Standardization (WIB)]');
const sampleDate = new Date('2026-08-25T10:30:00');
assert(formatShortDate(sampleDate).includes('Agu'), `Short date format exists [Got: ${formatShortDate(sampleDate)}]`);
assert(formatFullWIBDate(sampleDate).includes('2026'), `Full WIB date contains 2026 [Got: ${formatFullWIBDate(sampleDate)}]`);
assert(formatTime24(sampleDate).includes(':'), `24h time format valid [Got: ${formatTime24(sampleDate)}]`);
assert(isSameDay(sampleDate, new Date('2026-08-25T18:00:00')), `Same calendar day detection works`);
assert(!isSameDay(sampleDate, new Date('2026-08-26T10:30:00')), `Different calendar day detection works`);
assert(getStartOfWeek(sampleDate) instanceof Date, `Start of week returns valid Date object`);

// Test Suite 8: AI Progressive Overload Engine (Double Progression Method)
console.log('\n🧪 [Test Suite 8: AI Progressive Overload Engine (Double Progression)]');
// 1. Repetisi Progression (Beban TETAP sama, Target Repetisi Naik)
const benchRepProgression = calculateProgressiveOverload('Incline Dumbbell Bench Press', [{ weight_kg: 30, reps: 8 }]);
assert(benchRepProgression.recommendedWeightKg === 30, `Bench 30kg x 8 -> Beban tetap 30kg [Got: ${benchRepProgression.recommendedWeightKg}]`);
assert(benchRepProgression.recommendedReps === 9, `Bench 30kg x 8 -> Target naik +1 rep ke 9 reps [Got: ${benchRepProgression.recommendedReps}]`);

// 2. Weight Micro-Load Progression (Target Reps Maksimal Tercapai -> Beban Naik)
const benchWeightProgression = calculateProgressiveOverload('Incline Dumbbell Bench Press', [{ weight_kg: 30, reps: 12 }]);
assert(benchWeightProgression.recommendedWeightKg === 32.5, `Bench 30kg x 12 (Puncak) -> Naik beban 32.5kg (+2.5kg) [Got: ${benchWeightProgression.recommendedWeightKg}]`);
assert(benchWeightProgression.recommendedReps === 8, `Bench 32.5kg -> Reset target ke 8 reps [Got: ${benchWeightProgression.recommendedReps}]`);

const curlRepProgression = calculateProgressiveOverload('Bicep Cable Curl', [{ weight_kg: 15, reps: 12 }]);
assert(curlRepProgression.recommendedWeightKg === 15, `Curl 15kg x 12 -> Beban tetap 15kg [Got: ${curlRepProgression.recommendedWeightKg}]`);
assert(curlRepProgression.recommendedReps === 13, `Curl 15kg x 12 -> Target naik ke 13 reps [Got: ${curlRepProgression.recommendedReps}]`);

const curlWeightProgression = calculateProgressiveOverload('Bicep Cable Curl', [{ weight_kg: 15, reps: 15 }]);
assert(curlWeightProgression.recommendedWeightKg === 16.3 || curlWeightProgression.recommendedWeightKg === 16.25, `Curl 15kg x 15 (Puncak) -> Naik beban 16.3kg (+1.25kg) [Got: ${curlWeightProgression.recommendedWeightKg}]`);

// 3. New Account / Zero History -> Clean Unobtrusive State (No Starter Forced)
const zeroHistoryCheck = calculateProgressiveOverload('Barbell Bench Press', []);
assert(zeroHistoryCheck.hasData === false, `Zero History returns hasData: false (Clean UI, no forced starter) [Got: ${zeroHistoryCheck.hasData}]`);
assert(zeroHistoryCheck.recommendedWeightKg === 0, `Zero History recommended weight is 0 [Got: ${zeroHistoryCheck.recommendedWeightKg}]`);

// 4. RPE Auto-Regulation & Velocity Feedback
const easySetProgression = calculateProgressiveOverload('Barbell Bench Press', [{ weight_kg: 40, reps: 10, rpe: 6 }], 40, 10, 65, 6);
assert(easySetProgression.recommendedWeightKg === 42.5, `Bench 40kg x 10 with RPE 6 (Easy) -> Auto-promotes weight to 42.5kg [Got: ${easySetProgression.recommendedWeightKg}]`);

// 5. Intra-Workout Acute Fatigue Dropoff Detection
const fatigueDropoff = calculateProgressiveOverload('Incline Dumbbell Bench Press', [
  { kg: '20', reps: '12', completed: true },
  { kg: '20', reps: '6', completed: true }, // Acute drop from 12 to 6 reps
  { kg: '', reps: '', completed: false }
]);
assert(fatigueDropoff.isBackoffSet === true, `Acute drop detected -> Recommends Back-off Set [Got isBackoffSet: ${fatigueDropoff.isBackoffSet}]`);
assert(fatigueDropoff.recommendedWeightKg === 16, `20kg dropped -> Back-off weight 16kg (-20%) [Got: ${fatigueDropoff.recommendedWeightKg}]`);

// Test Suite 9: Hypertrophy Volume Landmarks (MEV/MAV/MRV)
console.log('\n🧪 [Test Suite 9: Hypertrophy Volume Landmarks]');
const chestUnder = calculateVolumeLandmarks('chest', 4);
assert(chestUnder.status === 'under_mev', `Chest 4 sets -> under_mev [Got: ${chestUnder.status}]`);

const chestOptimal = calculateVolumeLandmarks('chest', 14);
assert(chestOptimal.status === 'optimal_mav', `Chest 14 sets -> optimal_mav [Got: ${chestOptimal.status}]`);

const backOver = calculateVolumeLandmarks('back', 28);
assert(backOver.status === 'over_mrv', `Back 28 sets -> over_mrv [Got: ${backOver.status}]`);

// Test Suite 10: Dynamic Rest Time Optimizer
console.log('\n🧪 [Test Suite 10: Dynamic Rest Time Optimizer]');
assert(calculateRecommendedRestTime('Barbell Back Squat', 120, 5, 9.5) === 180, `Heavy Squat RPE 9.5 -> 180s rest (3 mins) [Got: ${calculateRecommendedRestTime('Barbell Back Squat', 120, 5, 9.5)}s]`);
assert(calculateRecommendedRestTime('Barbell Bench Press', 80, 8, 8) === 120, `Standard Bench RPE 8 -> 120s rest (2 mins) [Got: ${calculateRecommendedRestTime('Barbell Bench Press', 80, 8, 8)}s]`);
assert(calculateRecommendedRestTime('Dumbbell Lateral Raise', 6, 15, 8) === 60, `Lateral Raise Isolation -> 60s rest [Got: ${calculateRecommendedRestTime('Dumbbell Lateral Raise', 6, 15, 8)}s]`);

// Test Suite 11: Biomechanical Form & Eccentric Tempo Cues
console.log('\n🧪 [Test Suite 11: Biomechanical Form & Eccentric Tempo Cues]');
const benchCue = getBiomechanicalCue('Barbell Bench Press');
assert(benchCue.tempo === '3-0-1-0', `Bench Press tempo is 3-0-1-0 [Got: ${benchCue.tempo}]`);
assert(benchCue.cue.includes('skapula'), `Bench Press cue contains scapular retraction [Got: ${benchCue.cue}]`);

const deltCue = getBiomechanicalCue('Dumbbell Lateral Raise');
assert(deltCue.tempo === '2-1-2-0', `Lateral Raise tempo is 2-1-2-0 [Got: ${deltCue.tempo}]`);
assert(deltCue.focusMuscle.includes('Deltoid'), `Lateral Raise focus is Deltoid [Got: ${deltCue.focusMuscle}]`);

// Test Suite 12: Cross-Muscle Kinetic Chain & Recovery Fatigue Warning Engine
console.log('\n🧪 [Test Suite 12: Cross-Muscle Kinetic Chain Warnings]');
const now = Date.now();
const pastWorkoutsSample = [
  {
    created_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
    exercises: [{ name: 'Deadlift Konvensional' }]
  }
];
const squatKineticWarning = checkKineticChainFatigue('Barbell Back Squat', pastWorkoutsSample);
assert(squatKineticWarning.isFatigued === true, `Squat 24h after Deadlift triggers fatigue warning [Got isFatigued: ${squatKineticWarning.isFatigued}]`);
assert(squatKineticWarning.recoveryScore <= 40, `Recovery score is low (<=40%) [Got: ${squatKineticWarning.recoveryScore}%]`);

const freshSquatCheck = checkKineticChainFatigue('Barbell Back Squat', []);
assert(freshSquatCheck.isFatigued === false, `Empty history returns isFatigued: false [Got: ${freshSquatCheck.isFatigued}]`);

// Test Suite 13: 4-Week Plateau Breaker & Exercise Variation Rotation
console.log('\n🧪 [Test Suite 13: 4-Week Plateau Breaker & Rotation]');
const plateauSessions = [
  { maxWeight: 60 },
  { maxWeight: 60 },
  { maxWeight: 60 }
];
const benchPlateau = detectPlateauAndSuggestRotation('Barbell Bench Press', plateauSessions);
assert(benchPlateau.isPlateau === true, `3 sessions stuck at 60kg detects plateau [Got isPlateau: ${benchPlateau.isPlateau}]`);
assert(benchPlateau.alternativeExercise.includes('Incline Dumbbell Press'), `Suggests Incline Dumbbell Press alternative [Got: ${benchPlateau.alternativeExercise}]`);

const normalProgressSessions = [
  { maxWeight: 62.5 },
  { maxWeight: 60 },
  { maxWeight: 57.5 }
];
const normalBench = detectPlateauAndSuggestRotation('Barbell Bench Press', normalProgressSessions);
assert(normalBench.isPlateau === false, `Progressing weight returns isPlateau: false [Got: ${normalBench.isPlateau}]`);

// Test Suite 14: Voice-Activated Hands-Free Workout Logger Speech Parser
console.log('\n🧪 [Test Suite 14: Voice Workout Logger Speech Parser]');
const voiceCmd1 = parseVoiceWorkoutCommand('Coach, catat 80 kilo 8 repetisi');
assert(voiceCmd1.success === true && voiceCmd1.weightKg === 80 && voiceCmd1.reps === 8, `Parse "Coach, catat 80 kilo 8 repetisi" -> 80kg x 8 reps [Got: ${voiceCmd1.weightKg}kg x ${voiceCmd1.reps} reps]`);

const voiceCmd2 = parseVoiceWorkoutCommand('75kg 10 rep');
assert(voiceCmd2.success === true && voiceCmd2.weightKg === 75 && voiceCmd2.reps === 10, `Parse "75kg 10 rep" -> 75kg x 10 reps [Got: ${voiceCmd2.weightKg}kg x ${voiceCmd2.reps} reps]`);

const voiceCmd3 = parseVoiceWorkoutCommand('beban 25 kilo repetisi 12');
assert(voiceCmd3.success === true && voiceCmd3.weightKg === 25 && voiceCmd3.reps === 12, `Parse "beban 25 kilo repetisi 12" -> 25kg x 12 reps [Got: ${voiceCmd3.weightKg}kg x ${voiceCmd3.reps} reps]`);

const voiceCmdEmpty = parseVoiceWorkoutCommand('');
assert(voiceCmdEmpty.success === false, `Empty voice command returns success: false [Got: ${voiceCmdEmpty.success}]`);

// Summary
console.log('\n========================================');
if (failedTests === 0) {
  console.log(`\x1b[32m🎉 ALL ${passedTests} TESTS PASSED! 10/10 VERIFIED!\x1b[0m`);
  console.log('========================================\n');
  process.exit(0);
} else {
  console.error(`\x1b[31m❌ ${failedTests} TESTS FAILED out of ${passedTests + failedTests}\x1b[0m`);
  console.log('========================================\n');
  process.exit(1);
}
