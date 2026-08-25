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
} = require('../utils/fitnessMath');

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

// 1. Test 1RM Calculations
console.log('🧪 [Test Suite 1: 1-Rep Max (1RM)]');
const rm100x5 = calculate1RM(100, 5);
assert(rm100x5 === 113, `100kg x 5 reps = 113kg (Brzycki) [Got: ${rm100x5}]`);
const rm100x1 = calculate1RM(100, 1);
assert(rm100x1 === 100, `100kg x 1 rep = 100kg [Got: ${rm100x1}]`);
const rmZero = calculate1RM(0, 5);
assert(rmZero === 0, `0kg x 5 reps = 0kg [Got: ${rmZero}]`);

// 2. Test Plate Breakdown
console.log('\n🧪 [Test Suite 2: Olympic Plate Loading]');
const plate100 = calculatePlateBreakdown(100, 20);
assert(plate100.weightPerSide === 40, `100kg barbell -> 40kg per side [Got: ${plate100.weightPerSide}]`);
assert(plate100.platesPerSide.length === 2, `40kg side = 25kg + 15kg (2 plates) [Got count: ${plate100.platesPerSide.length}]`);
assert(plate100.platesPerSide[0].weight === 25, `First plate is 25kg [Got: ${plate100.platesPerSide[0].weight}]`);
assert(plate100.platesPerSide[1].weight === 15, `Second plate is 15kg [Got: ${plate100.platesPerSide[1].weight}]`);

// 3. Test TDEE & Macro Calculations
console.log('\n🧪 [Test Suite 3: TDEE & Macronutrient Architect]');
const tdeeCut = calculateTDEE({ weightKg: 70, heightCm: 175, ageYears: 24, goal: 'cut' });
assert(tdeeCut.targetCals > 1500 && tdeeCut.targetCals < 2500, `70kg cut calories within reasonable range [Got: ${tdeeCut.targetCals} kcal]`);
assert(tdeeCut.proteinGrams === 154, `70kg protein = 154g (2.2g/kg) [Got: ${tdeeCut.proteinGrams}g]`);
assert(tdeeCut.waterLiters === 2.8, `70kg water intake = 2.8L (40ml/kg) [Got: ${tdeeCut.waterLiters}L]`);

// 4. Test Heart Rate Zones
console.log('\n🧪 [Test Suite 4: Cardio HR Zones (Karvonen)]');
const hr25 = calculateHeartRateZones(25);
assert(hr25.maxHR === 195, `25yo max HR = 195 BPM [Got: ${hr25.maxHR}]`);
assert(hr25.zones.length === 5, `HR Zones count is 5 [Got: ${hr25.zones.length}]`);
assert(hr25.zones[1].name.includes('Zone 2'), `Zone 2 is present [Got: ${hr25.zones[1].name}]`);

// 5. Test Anatomical Muscle Taxonomy Detection
console.log('\n🧪 [Test Suite 5: Multilingual Muscle Taxonomy]');
const pullMuscles = detectMuscleGroups('Lat Pulldown [Lats], Incline Bicep Curl [Biceps], Conventional Deadlift');
assert(pullMuscles.includes('lats'), `Detected 'lats' from Lat Pulldown [Got: ${pullMuscles.join(', ')}]`);
assert(pullMuscles.includes('biceps'), `Detected 'biceps' from Incline Bicep Curl`);
assert(pullMuscles.includes('lower_back'), `Detected 'lower_back' from Deadlift`);
assert(pullMuscles.includes('traps'), `Detected 'traps' from Deadlift`);

const pushMuscles = detectMuscleGroups('Barbell Bench Press, Dumbbell Lateral Raise, Triceps Pushdown');
assert(pushMuscles.includes('chest'), `Detected 'chest' from Bench Press`);
assert(pushMuscles.includes('shoulders'), `Detected 'shoulders' from Lateral Raise`);
assert(pushMuscles.includes('triceps'), `Detected 'triceps' from Pushdown`);

// 6. Test Muscle Recovery Decay
console.log('\n🧪 [Test Suite 6: CNS Muscle Recovery Decay]');
const rec2h = calculateMuscleRecovery(2);
assert(rec2h.status === 'Fatigued' && rec2h.percentage <= 35, `2 hours ago = Fatigued (<=35%) [Got: ${rec2h.status} ${rec2h.percentage}%]`);
const rec36h = calculateMuscleRecovery(36);
assert(rec36h.status === 'Recovering' && rec36h.percentage >= 35 && rec36h.percentage <= 70, `36 hours ago = Recovering (35-70%) [Got: ${rec36h.status} ${rec36h.percentage}%]`);
const rec80h = calculateMuscleRecovery(80);
assert(rec80h.status === 'Fresh' && rec80h.percentage === 100, `80 hours ago = Fresh (100%) [Got: ${rec80h.status} ${rec80h.percentage}%]`);

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
