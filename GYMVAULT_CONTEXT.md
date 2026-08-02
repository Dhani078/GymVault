# GymVault — Project Context & Architecture Map

> **Note for AI Coding Assistants:** Read this file first to understand the GymVault codebase. Do not ask the user for basic context. Respect the core guidelines and database structures documented below.

---

## 1. Project Overview & Visual Theme
GymVault is an elite, high-performance fitness mobile application designed for tracking workouts, routines, weight logs, and nutrition scanning.
* **Theme & Styling:** AMOLED Pitch Black (`#000000`) backgrounds and Electric Green (`#CCFF00`) accents. Premium design with glassmorphism, clean layouts, and smooth animations.
* **Principles:** 
  1. *Clean Architecture:* Strict separation between UI (components/screens) and logic (custom hooks/contexts).
  2. *Performance First:* High utilization of `useMemo`, `useCallback`, and memoized items for a zero-flicker experience.
  3. *Security:* Strict Row-Level Security (RLS) on all Supabase queries. Always filter queries by authenticated `auth.uid()`.
  4. *Modularity:* Keep components under 300 lines; otherwise, refactor into sub-components.

---

## 2. Tech Stack & Dependencies
* **Core:** React Native (Expo v54.0.0+)
* **Database/Backend:** Supabase (Postgres with RLS)
* **Icons:** `lucide-react-native`
* **Local Persistence:** `@react-native-async-storage/async-storage`
* **Notifications & Activities:** `@notifee/react-native`, `expo-notifications`, and `LiveActivityManager` (for iOS/Android live workout state widget integration)
* **Camera / Media:** `expo-image-picker` and OCR scanning library integrations

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
   * `is_completed`: BOOLEAN

4. **`public.workout_sets`**
   * `id`: UUID (Primary Key)
   * `session_id`: UUID (References `workout_sessions.id` with CASCADE delete)
   * `exercise_id`: UUID (References `exercises.id`)
   * `set_index`: INT
   * `weight_kg`: REAL
   * `reps`: INT
   * `is_checked`: BOOLEAN

5. **`public.nutrition_logs`**
   * `id`: UUID (Primary Key)
   * `user_id`: UUID (References Auth.users)
   * `food_name`: TEXT
   * `calories`: NUMERIC
   * `protein`: NUMERIC
   * `carbs`: NUMERIC
   * `fats`: NUMERIC
   * `created_at`: TIMESTAMP WITH TIME ZONE

6. **`public.body_weight_logs`**
   * `id`: UUID (Primary Key)
   * `user_id`: UUID (References Auth.users)
   * `weight_kg`: NUMERIC
   * `created_at`: TIMESTAMP WITH TIME ZONE

### Custom Database Functions & RPCs
* `get_email_by_username(lookup_username TEXT) -> TEXT`: Returns email from `users_profile` for a given username (used in secure authentication flow).
* `get_global_leaderboard() -> TABLE(...)`: Bypasses RLS to query aggregated totals (volume, workout count, active streak) to return a descending leaderboard.
* `search_users(search_query TEXT) -> TABLE(...)`: Returns users based on search queries containing matching names or usernames, along with their training volume and current streaks.

---

## 4. App Structure & File Map

### Core Configuration & Boot
* `App.js`: Root file containing main providers (`LanguageProvider`, `AppModeProvider`, `DynamicIslandProvider`), notification handlers, tab navigation, and active workout AsyncStorage state syncing.
* `theme.js`: Standard styling sheets, colors (`#CCFF00`, `#000000`), fonts, and global theme configurations.
* `supabaseClient.js`: Initialized Supabase client with safe verification & database health checks.

### Contexts
* `contexts/AppModeContext.js`: The **Adaptive Engine**. Manages `gym` mode vs `home` mode. Persists settings to AsyncStorage. Contains the exercise conversion matrix (`EXERCISE_SWAP_MAP`) for swapping machine movements to home equivalents.
* `contexts/DynamicIslandContext.js`: Coordinates system-wide overlays/pill notifications and active workout status indicators.
* `contexts/LanguageContext.js`: Dictionary values and language hooks for localized text.

### Custom Hooks
* `hooks/useAdaptiveUI.js`: Consumes `AppModeContext` to dynamically control feature visibility flags (e.g., hiding plate calculators in home mode, showing home timers), modifying UI labels, and filtering exercise lists depending on user's current mode.
* `hooks/useProfileData.js`: Centralized hook for fetching/updating user profile metadata, stats, and weight logs.

### Services
* `services/LiveActivityManager.js`: Handles live updates to background system actions, notification cards, and iOS-like Live Activity integrations.

### Components
* `components/AIRoutineModal.js`: Dialog that uses AI suggestion models to build or recommend workouts.
* `components/SocialLeaderboardModal.js`: Leaderboard scoreboard modal showing top lifters.

### Screens Map
* `AuthScreen.js`: User login (username or email) and register panel.
* `DashboardScreen.js`: User's primary landing. Includes volume statistics, routine launchers, muscle fatigue maps (SVG-based), and the global leaderboard.
* `LibraryScreen.js`: Browse available exercises. Filters dynamically by equipment in Home Mode.
* `LoggerScreen.js`: Live workout logger with Text-To-Speech audio assistant. Tracks current exercise, set weights, repetitions, and checks off sets. Retains states via AsyncStorage.
* `HistoryScreen.js`: Multi-log calendar-style log displaying history tabs for completed workouts, nutrition (meals), and water intake logs, with individual delete/remove options.
* `ProfileScreen.js`: Profile stats, bodyweight charts, language selectors, and sign-out.
* `NutritionScannerModal.js`: Scanner that takes image-to-text data of nutritional labels and posts logs to `nutrition_logs`.
* `AIMealPlanModal.js`: AI-powered nutritional menu plan builder with targets, calorie calculators, and allergen exclusion lists.
* `AIChatBubble.js`: Floating interactive coach bubble for fitness advice, custom routine generation, and direct text-logging (water, nutrition, workouts) processed via structured Gemini JSON output with inline interactive confirmation cards, Undo capability, muscle group classification, and local date timezone-safety.
* `OnboardingScreen.js` / `PaywallScreen.js`: User onboarding flow and subscription paywall.

*Note: The older gym playlist module has been completely deprecated and removed from the application scope.*

---

## 5. Current State: The Adaptive Engine Focus
* The current priority task is the **Adaptive Engine**.
* When toggled to **Home Mode**:
  * Equipment inventory is restricted to user's selected home inventory (stored in `@gymvault_equipment_inventory`).
  * Exercises in the `LibraryScreen` are filtered to match the available inventory.
  * Exercises in active routines that require gym machines are automatically swapped (e.g., "Lat Pulldown" becomes "Resistance Band Lat Pulldown") if the user has that equipment in their inventory.
  * Weight-based inputs switch to intensity options/rep focuses.

---

## 6. Recent Technical Implementations & Security Patterns

### 📴 Offline Sync & Auto-Queue Engine
* **Connectivity Checker:** Located in `DashboardScreen.js`. Uses a hybrid detection strategy:
  * **Web (`Platform.OS === 'web'`):** Uses `navigator.onLine` combined with active window event listeners (`online`, `offline`) for zero-request, CORS-safe, instantaneous UI updates.
  * **Native Mobile:** Employs `Promise.race` with standard GET requests to Google's `generate_204` and the Supabase API URL (`https://sjrzhiigrcrcpgvnfixo.supabase.co`).
* **Queue Storage:** Queued workout payloads are saved locally in AsyncStorage under `offline_workouts_${userId}`.
* **Sync Protocol:** Once online is detected, the app performs sequential bulk insertions:
  1. Inserts the workout session to `workout_sessions`.
  2. Retrieves the generated UUID `session_id`.
  3. Maps the corresponding sets to reference that `session_id` and bulk inserts them into `workout_sets`.
* **Sync HUD:** A glassmorphic top-level status banner on `DashboardScreen` displays sync status, network state, and pending queue size.

### 🗺️ SVG Muscle Recovery Map
* **Component:** `components/MuscleRecoveryMap.js`.
* **Visuals:** Custom SVG linear gradients (`grad-fresh`, `grad-recovering`, `grad-fatigued`) that overlay precise, anatomically mapped body group paths (front and back contours) instead of generic rectangles.
* **Anatomical Granularity:** Split into 12 detailed muscle groups (Chest, Lats, Lower Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Core, Traps, Glutes, Calves) mapped to specific front and back coordinates.
* **Math & Decay Engine:** 
  * Computes base fatigue from `workout_sessions` completed in the last 7 days.
  * Allows manual override status logging (`Sore 🔴`, `Pemulihan 🟡`, `Segar 🟢`) saved under `muscle_recovery_overrides_${userId}` in AsyncStorage.
  * Natural recovery decay: Recovery percentages increase mathematically by `1.25%` per hour elapsed since the last manual override timestamp, eliminating background thread overhead.
* **Prescriptions:** Offers customized stretch/rehab exercises for fatigued muscle groups (<70%) and compound lifting recommendations for fresh groups (>70%).
* **Demo/Developer Seeds:** In `screens/ProfileScreen.js`, developers can trigger a programmatically generated 7-day workout history in Supabase (chest, shoulders, lats, lower back, quads, hamstrings) and manual overrides (biceps, triceps, traps) to showcase the full colorized gradient map.

### 🗣️ Voice Assistant / Audio Guide (TTS)
* **Location:** Built inside `screens/LoggerScreen.js`.
* **Tech:** Uses `expo-speech` to read aloud workout events (Set Checkoffs, Rest Timers, Personal Records, Workout Finish).
* **Localization:** Bilingual support detects active Language Context and speaks natively in Indonesian or English.
* **Persistence:** Managed by an on-screen switch and persisted in AsyncStorage so the preference is remembered. Default state is off.

### 🍖 AI Meal Plan Generator
* **Component:** `screens/AIMealPlanModal.js`.
* **Capabilities:** Builds full calorie/macro split meal menus based on goal, budget, and dietary restrictions. Saves output locally for offline reference.
* **Rate Limiting:** Protects OpenAI/Gemini endpoints by enforcing a daily limit of 3 generations per user (tracked using user-specific daily check keys in AsyncStorage).

### 🔒 Secure Multi-User Scoping & Security Hardening
* All client-side storage keys are appended with the user's Supabase UUID (e.g. `is_premium_${userId}`, `offline_workouts_${userId}`, `muscle_recovery_overrides_${userId}`) to guarantee total data and security isolation.
* **Environment Variables:** Private API keys and backend settings are moved to a `.env` file (e.g. `EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) with fallback defaults for localized production and development configurations. Added `.env` to `.gitignore`.
* **Developer/Debug Guard:** Debugging and database seeding controls (e.g., "Seed Demo Workout History" and "Set Account to Pro Mode" toggle) in `ProfileScreen.js` are wrapped in React Native's `__DEV__` guard to hide them from end-users in production builds.
* **Input Validation:** Stricter validation regex added to `AuthScreen.js` for both usernames (alphanumeric and underscores only, 3-20 characters) and email formats to prevent malformed or malicious registration entries.
* **Database Policy Audits:** Added missing `DELETE` RLS policies for both `workout_sessions` and `workout_sets` in the schema mapping files (`setup_database.sql`, `schema.sql`) to prevent unauthorized modification.
* **Aggregated Queries Protection:** Cap query result lists (e.g. `LIMIT 50` on `get_global_leaderboard` function in `supabase_updates.sql` and `setup_database.sql`) to prevent database resource exhaustion and limit user-data exposure.
* **Strict Profile Insert:** Updated `profile_insert` from `WITH CHECK (true)` to `WITH CHECK (auth.uid() = id)` to ensure authenticated users can only insert their own profiles.

---

## 7. High-Performance UI Architecture (Upcoming/Blueprint)
To achieve Lenis/Framer Motion-level smoothness (60/120 FPS) and premium micro-interactions, the app is transitioning towards a high-performance stack:
* **Shopify FlashList:** Replacing standard `FlatList` and `ScrollView` for rendering hundreds of data points (e.g., Daily Logs, Library). FlashList recycles views instantly, eliminating blank spaces and stuttering during fast scrolls.
* **React Native Reanimated (v3):** Utilizing worklets to run animations strictly on the UI thread. Core for Scroll-bound interpolations (Card Scaling, Parallax Headers) and Apple Dynamic Island-like fluid transitions.
* **React Native Skia:** High-performance 2D graphics engine (Canvas). Used for rendering complex, animating data visualization (e.g., Progress rings, Volume charts) and true native glassmorphism (Backdrop blur) without frame drops.

---

## 8. Future Roadmap: The "Killer Features" Blueprint
* **Volume 1RM Progress (Data Analytics):** Line charts tracking the One Rep Max for specific exercises over time, utilizing `react-native-skia` or `victory-native` for high-performance rendering.
* **Nutrition Macro Rings:** Integration of Daily Calorie/Macro goals (Protein, Carbs, Fats) on the Dashboard using `SkiaProgressRing.js`, fetching aggregated daily data from `nutrition_logs`.
* **Social Feed:** A dedicated Feed tab to view friends' recently completed workouts (including their total volume and active streaks) to drive community engagement and retention.

---

## 9. Recent Refinements & Production Polish (Pre-Release)
To ensure GymVault meets the "Anti-Slop" High-End standard and functions flawlessly:
* **Dynamic Hydration:** Water intake targets are no longer hardcoded (2000ml). They dynamically scale based on `body_weight * 35`. Visualized via an 8-glass responsive UI.
* **Biometric AI Prompts:** AI Meal Planner integrates actual `body_weight` and `height` to ensure macronutrient recommendations are physically accurate for the specific user.
* **Trophy Cabinet V2:** Gamification system refactored into a scalable array-driven UI mapping 6 core achievements (First Blood, Consistency King, Iron Addict, The Elephant, Titan Strength, Streak Master).
* **Enhanced Daily Check-In:** Replaced static text prompts with a 7-day visual node trail, utilizing dynamic glowing states for current-day claims and past-day checkmarks.
* **Stability:** Removed unstable third-party visual dependencies (`react-native-confetti-cannon`) that blocked cross-platform bundling, ensuring zero-error compilation for APK and Web builds.
