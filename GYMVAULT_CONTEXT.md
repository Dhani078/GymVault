@MEMORY.md
# GymVault — Project Context & Architecture Map

> **Note for AI Coding Assistants:** Read this file and `MEMORY.md` first to understand the GymVault codebase. Do not ask the user for basic context. Respect the core guidelines and database structures documented below.

---

## 1. Project Overview & Visual Theme
GymVault is a certified 10/10 production-ready, high-performance fitness application designed for tracking workouts, routines, weight logs, and nutrition scanning.
* **Theme & Styling:** AMOLED Pitch Black (`#000000`) backgrounds and Electric Green (`#CCFF00`) accents. Premium design with glassmorphism, clean layouts, and smooth animations.
* **Principles:** 
  1. *Clean Architecture:* Strict separation between UI (components/screens) and pure logic (`utils/fitnessMath.js`).
  2. *Performance First:* High utilization of `useMemo`, `useCallback`, `React.lazy`, and memoized items for a zero-flicker experience.
  3. *Security:* Strict Row-Level Security (RLS) on all Supabase queries. Always filter queries by authenticated `auth.uid()`.
  4. *Test Verification:* 100% mathematical precision enforced via automated unit test runner (`npm test` - 61/61 assertions).

---

## 2. Tech Stack & Dependencies
* **Core:** React Native (Expo v54.0.0+)
* **Database/Backend:** Supabase (Postgres with RLS & Storage)
* **AI Intelligence:** Google Gemini 3.7 Flash Cascade (7-layer auto-fallback)
* **Icons:** `lucide-react-native`
* **Local Persistence:** `@react-native-async-storage/async-storage`
* **Notifications & Activities:** `@notifee/react-native`, `expo-notifications`, and `LiveActivityManager`
* **Camera / Speech:** `expo-image-picker`, `expo-speech`, and Web Speech Recognition API

---

## 3. Database Schema (Supabase Postgres)

### Tables
1. **`public.users_profile`**
   * `id`: UUID (Primary Key, references Auth.users)
   * `name`: TEXT (User's full name)
   * `username`: TEXT (Unique username)
   * `email`: TEXT (User's email)
   * `body_weight`: REAL
   * `height`: REAL
   * `cns_fatigue`: INT (Default 0)
   * `custom_routines`: JSONB (Default `[]` - list of user's custom-built routines)
   * `role`: TEXT ('admin' | 'user')
   * `is_premium`: BOOLEAN (Default false)
   * `premium_plan`: TEXT
   * `premium_until`: TIMESTAMP WITH TIME ZONE
   * `created_at`: TIMESTAMP WITH TIME ZONE

2. **`public.exercises`** (Public read, reference table for movements)
   * `id`: UUID (Primary Key)
   * `name`: TEXT (Unique)
   * `muscle_group`: TEXT
   * `equipment_type`: TEXT
   * `thumbnail_url`: TEXT

3. **`public.workout_sessions`**
   * `id`: UUID (Primary Key)
   * `user_id`: UUID (References `users_profile.id`)
   * `split_name`: TEXT
   * `started_at`: TIMESTAMP WITH TIME ZONE
   * `is_completed`: BOOLEAN (Default false)

4. **`public.workout_sets`**
   * `id`: UUID (Primary Key)
   * `session_id`: UUID (References `workout_sessions.id`)
   * `exercise_id`: UUID (References `exercises.id`)
   * `set_index`: INT
   * `weight_kg`: REAL
   * `reps`: INT
   * `is_checked`: BOOLEAN (Default false)

5. **`public.payment_requests`**
   * `id`: UUID (Primary Key)
   * `user_id`: UUID (References `users_profile.id`)
   * `user_name`: TEXT
   * `user_email`: TEXT
   * `plan`: TEXT ('monthly' | 'yearly')
   * `amount`: NUMERIC
   * `proof_url`: TEXT (Supabase Storage URL)
   * `status`: TEXT ('pending' | 'approved' | 'rejected')
   * `created_at`: TIMESTAMP WITH TIME ZONE
   * `reviewed_at`: TIMESTAMP WITH TIME ZONE

---

## 4. Multi-Platform Single URL Adaptive Architecture
* **Live Domain**: `https://gymvault-app.vercel.app`
* **Mobile (< 768px)**: Native mobile PWA logger and athlete suite.
* **PC Guest (≥ 768px)**: High-End Cinematic Landing Page with 7 live interactive calculators.
* **PC Admin (≥ 768px)**: Real-time Player Analytics & Payment Verification Dashboard (`role === 'admin'`).
* **Desktop Switcher**: Discrete floating bar allowing instant 1-click preview switching between Landing Page, Admin Panel, and App View.

---

## 5. Certified 10/10 Core Engines

1. **Fitness Mathematics Engine (`utils/fitnessMath.js`)**:
   - `calculate1RM(weight, reps)`: Brzycki formula with boundary protections.
   - `calculatePlateBreakdown(targetWeight)`: Official IPF/IWF colored bumper plates.
   - `calculateTDEE(weight, height, age, goal)`: Mifflin-St Jeor metabolic architect.
   - `calculateHeartRateZones(age)`: Karvonen cardio zones 1-5.
   - `detectMuscleGroups(text)`: Multilingual & scientific anatomical taxonomy parser.
   - `calculateMuscleRecovery(hoursAgo)`: Dynamic CNS and muscle fatigue decay.
   - `calculateProgressiveOverload(history, exerciseName, currentSetIndex, rpe)`: Double progression engine with back-off set recommendations.
   - `detectKineticChainFatigue(history, currentExerciseName)`: Stabilizer protection against overlapping heavy compound fatigue.
   - `detectPlateauAndRotate(history, exerciseName)`: 4-week stagnation rotation detector.
   - `parseVoiceWorkoutCommand(transcript)`: Hands-free natural speech parser for set & rep logging.

2. **Automated Verification Suite (`scripts/test-fitness-engine.js`)**:
   - 61/61 assertions verifying pure mathematical precision across all 14 physiological and parser test suites. Run via `npm test`.

3. **2-Way Telegram Bot Webhook & AI Fraud Detection (`api/payment-notify.js` & `api/telegram-webhook.js`)**:
   - Google Gemini 3.7 Vision receipt audit cascade.
   - Real-time in-place Telegram message updates on `[ ✅ ACC ]` and `[ ❌ TOLAK ]`.
   - Long-term receipt image archiving to Supabase Storage `payment_receipts` bucket.
