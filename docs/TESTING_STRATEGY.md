# GymVault Automated Testing Strategy & Assertion Suite

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Testing Philosophy

GymVault enforces a Zero-Overhead, High-Determinism testing philosophy:
- Zero Heavy Test Frameworks: Test suites execute via native Node.js runtimes without Jest, Mocha, or Babel overhead, completing all 80 assertions in under 250 milliseconds.
- Pure Functional Determinism: Core mathematical and analytical functions in utils/fitnessMath.js and utils/dateHelpers.js have zero side effects, zero external dependencies, and produce 100% predictable outputs.
- Cryptographic Integrity: Payment notification handlers in services/dokuService.js are exercised against real HMAC-SHA256 digests, tampered payloads, and forged signatures using crypto.timingSafeEqual.

Command to run all tests:
```bash
npm test
```

---

## 2. Test Suite Breakdown (80 Total Assertions)

### Suite 1: One-Rep Max (1RM) Formula (Brzycki)
- 100kg x 5 reps = 113kg estimated 1RM
- 100kg x 1 rep = 100kg exact
- 0kg x 5 reps = 0kg baseline

### Suite 2: Olympic Plate Loading Simulator
- 100kg barbell -> 40kg load per side on a 20kg bar
- 40kg per side resolved into minimal plate count (25kg + 15kg)
- First plate validated as 25kg red bumper plate
- Second plate validated as 15kg yellow bumper plate

### Suite 3: TDEE & Macronutrient Architect (Mifflin-St Jeor)
- 70kg cutting calorie target within 2000-2100 kcal
- Daily protein target = 154g (2.2g per kg bodyweight)
- Daily hydration target = 2.8L (40ml per kg bodyweight)

### Suite 4: Cardio Heart Rate Zones (Karvonen Formula)
- 25-year-old maximum heart rate = 195 BPM
- 5 discrete training zones calculated (Active Recovery to Maximum Effort)
- Zone 2 aerobic base presence and boundary verification

### Suite 5: Multilingual Muscle Taxonomy Parser
- Lat Pulldown -> Lats, Biceps
- Incline Bicep Curl -> Biceps
- Conventional Deadlift -> Lower Back, Traps
- Barbell Bench Press -> Chest
- Dumbbell Lateral Raise -> Shoulders
- Cable Triceps Pushdown -> Triceps

### Suite 6: CNS Muscle Recovery Decay Curves
- 2 hours post-workout = Fatigued (<= 35% recovery)
- 36 hours post-workout = Recovering (35% to 70% recovery)
- 80 hours post-workout = Fresh (100% full muscular recovery)

### Suite 7: Date & Time Standardization (WIB / UTC Safe)
- Indonesian short date format (e.g. Agu 25)
- Full formal WIB date (e.g. Selasa, 25 Agustus 2026)
- 24-hour time clock (e.g. 10:30)
- Calendar day boundary detection
- Start of week calculation

### Suite 8: Progressive Overload Engine (Double Progression)
- Same weight maintained until upper rep target achieved
- Incremental +1 rep target progression
- Weight promotion (+2.5kg for barbell, +1.25kg for dumbbell) upon hitting target ceiling
- Rep reset to baseline upon weight increase
- RPE 6 easy set auto-promotion
- Back-off set recommendation (-20% load) on acute fatigue drop

### Suite 9: Hypertrophy Volume Landmarks
- 4 sets -> under_mev (insufficient stimulus)
- 14 sets -> optimal_mav (hypertrophic sweet spot)
- 28 sets -> over_mrv (excessive fatigue)

### Suite 10: Dynamic Rest Time Optimizer
- Heavy Compound RPE 9.5 -> 180s (3 minutes)
- Standard Compound RPE 8.0 -> 120s (2 minutes)
- Isolation Accessory -> 60s (1 minute)

### Suite 11: Biomechanical Form Cues & Eccentric Tempos
- Bench Press tempo = 3-0-1-0 with scapular retraction cue
- Lateral Raise tempo = 2-1-2-0 with deltoid focus cue

### Suite 12: Kinetic Chain Stabilizer Warnings
- Squat 24h after Deadlift -> Triggers fatigue warning (low lumbar recovery score)
- Clean history -> No warning triggered

### Suite 13: 4-Week Plateau Breaker & Exercise Rotation
- 3 consecutive sessions stuck at identical weight -> Plateau detected
- Recommends Incline Dumbbell Press / Machine Chest Press alternative

### Suite 14: Voice Workout Logger Natural Language Speech Parser
- "Coach, catat 80 kilo 8 repetisi" -> 80kg x 8 reps
- "75kg 10 rep" -> 75kg x 10 reps
- "beban 25 kilo repetisi 12" -> 25kg x 12 reps
- Empty or noise input -> Handled cleanly with success: false

### Suite 15: Edge Case Resilience & Mathematical Bounds
- Negative reps clamped to 1 rep
- Reps > 12 capped at 12 to maintain formula accuracy
- Weight below bar weight defaults to bar weight (0 plates)
- 22.5kg total load places 1.25kg micro-plate per side
- Leap day (February 29) calendar calculation accuracy

### Suite 16: Brand Design Tokens & Accessibility Contrast
- All 7 Olympic bumper plates have valid hex color codes
- 25kg plate is Red (#EF4444)
- 20kg plate is Blue (#3B82F6)

### Suite 17: Humanized Relative Timestamps (WIB Engine)
- 30 minutes ago -> "30 menit lalu"
- 3 hours ago -> "3 jam lalu"
- 25 hours ago -> "Kemarin"
- 3 days ago -> "3 hari lalu"
- getHoursAgo accuracy check

### Suite 18: DOKU QRIS Payment Gateway Verification
- HMAC-SHA256 signature generator format validation
- Genuine webhook signature verification returns true
- Tampered notification body rejection returns false
- Forged signature rejection returns false
