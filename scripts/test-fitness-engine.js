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

// Test Suite 8: AI Progressive Overload Engine
console.log('\n🧪 [Test Suite 8: AI Progressive Overload Engine]');
// Progressive Overload for existing lifter
const squatOverload = calculateProgressiveOverload('Barbell Back Squat', [{ weight_kg: 100, reps: 8 }]);
assert(squatOverload.recommendedWeightKg === 105, `Squat 100kg x 8 -> recommended 105kg (+5kg) [Got: ${squatOverload.recommendedWeightKg}]`);
assert(squatOverload.movementType === 'compound', `Squat classified as compound [Got: ${squatOverload.movementType}]`);

const benchOverload = calculateProgressiveOverload('Incline Dumbbell Bench Press', [{ weight_kg: 30, reps: 8 }]);
assert(benchOverload.recommendedWeightKg === 32.5, `Bench 30kg x 8 -> recommended 32.5kg (+2.5kg) [Got: ${benchOverload.recommendedWeightKg}]`);

const curlOverload = calculateProgressiveOverload('Bicep Cable Curl', [{ weight_kg: 15, reps: 12 }]);
assert(curlOverload.recommendedWeightKg === 16.3 || curlOverload.recommendedWeightKg === 16.25, `Curl 15kg x 12 -> recommended 16.3kg (+1.25kg) [Got: ${curlOverload.recommendedWeightKg}]`);
assert(curlOverload.movementType === 'isolation', `Curl classified as isolation [Got: ${curlOverload.movementType}]`);

// New Account / Beginner Adaptive Baselines
const newBarbell = calculateProgressiveOverload('Barbell Bench Press', []);
assert(newBarbell.recommendedWeightKg === 20, `New Account Barbell -> 20kg empty Olympic bar [Got: ${newBarbell.recommendedWeightKg}]`);

const newBodyweight = calculateProgressiveOverload('Push Up', []);
assert(newBodyweight.recommendedWeightKg === 0, `New Account Push Up -> 0kg bodyweight [Got: ${newBodyweight.recommendedWeightKg}]`);

const newDumbbell = calculateProgressiveOverload('Dumbbell Lateral Raise', []);
assert(newDumbbell.recommendedWeightKg === 4, `New Account Lateral Raise -> 4kg safe baseline [Got: ${newDumbbell.recommendedWeightKg}]`);

const newMachine = calculateProgressiveOverload('Lat Pulldown Machine', []);
assert(newMachine.recommendedWeightKg === 15, `New Account Lat Pulldown -> 15kg pin baseline [Got: ${newMachine.recommendedWeightKg}]`);

// Test Suite 9: Hypertrophy Volume Landmarks (MEV/MAV/MRV)
console.log('\n🧪 [Test Suite 9: Hypertrophy Volume Landmarks]');
const chestUnder = calculateVolumeLandmarks('chest', 4);
assert(chestUnder.status === 'under_mev', `Chest 4 sets -> under_mev [Got: ${chestUnder.status}]`);

const chestOptimal = calculateVolumeLandmarks('chest', 14);
assert(chestOptimal.status === 'optimal_mav', `Chest 14 sets -> optimal_mav [Got: ${chestOptimal.status}]`);

const backOver = calculateVolumeLandmarks('back', 28);
assert(backOver.status === 'over_mrv', `Back 28 sets -> over_mrv [Got: ${backOver.status}]`);

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
