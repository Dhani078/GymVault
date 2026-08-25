# GymVault — Persistent AI Memory & Knowledge Ledger

> **AI CONTEXT MEMORY**: This document serves as the master source of truth for any AI agent interacting with the GymVault codebase. It outlines core architectural invariants, database models, security mandates, design standards, and active workflows to ensure zero hallucinations and maximum execution precision.

---

## 1. Project Overview & Identity
- **Product Name**: GymVault
- **Description**: Elite, performance-driven cross-platform fitness & workout tracking application with an adaptive gym-versus-home engine, real-time logging, AI coaching, computer vision nutrition analysis, and unified desktop/mobile routing.
- **Visual Design Standard**: Strict AMOLED Pitch Black (`#000000`), Dark Surfaces (`#111111`, `#1A1A1A`), and Electric Green (`#CCFF00`) accents. Glassmorphism, micro-animations, and high-contrast typography.
- **Repository Path**: `c:\xampp\htdocs\GYM`

---

## 2. Technology Stack & Framework Invariants

| Layer | Technology | Key Details & Rules |
| :--- | :--- | :--- |
| **Mobile Runtime** | React Native (Expo SDK ~54.0.36) | Read versioned docs at `https://docs.expo.dev/versions/v54.0.0/`. Do NOT use deprecated APIs. |
| **Styling & Theme** | StyleSheet + Custom Tokens | AMOLED theme in `theme.js` & `contexts/ThemeContext.js`. Primary `#CCFF00`, Background `#000000`. |
| **Backend & Auth** | Supabase (PostgreSQL 15+) | Project ID `sjrzhiigrcrcpgvnfixo`. Strict RLS on all tables. Safe queries in `supabaseClient.js`. |
| **AI Integration** | Google Gemini 2.5 Flash | API Key sourced strictly via `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (or `/api` proxy). NO hardcoding. |
| **State & Modes** | React Context + AsyncStorage | `AppModeContext` (Gym vs Home), `ThemeContext`, `DynamicIslandContext`, `LanguageContext`. |
| **List Performance**| `@shopify/flash-list` (v2.0.2) | Prefer `FlashList` for high-volume datasets (Exercise Library, History, Logs). |
| **Graphics & Canvas**| `@shopify/react-native-skia` | Used for hardware-accelerated rings and progress charts. |
| **Animations** | `react-native-reanimated` | 60/120 FPS UI-thread animations and smooth gestures. |
| **Audio Guide** | `expo-speech` | Bilingual TTS (ID / EN) in `screens/LoggerScreen.js`. |
| **Desktop Web** | Single Vercel URL Deployment | Responsive routing in `components/AdaptiveLayout.js` (`< 768px`: Mobile; `≥ 768px`: Landing / Admin). |

---

## 3. Database Schema & Policy Map (Supabase)

### Tables & Primary Keys
1. **`users_profile`** (`id` UUID PRIMARY KEY references `auth.users`)
   - Columns: `name`, `username` (UNIQUE), `email`, `body_weight`, `height`, `cns_fatigue`, `custom_routines` (JSONB), `role` ('admin' | 'user'), `is_premium` (BOOL), `premium_plan`, `premium_until`, `avatar_url`, `created_at`.
   - Security: RLS enabled. UPDATE policy protected by `trg_prevent_profile_privilege_escalation` trigger preventing unauthorized client elevation to `role = 'admin'`.
2. **`exercises`** (`id` UUID PRIMARY KEY)
   - Columns: `name` (UNIQUE), `muscle_group`, `equipment_type`, `thumbnail_url`.
   - Security: Public SELECT (`true`).
3. **`workout_sessions`** (`id` UUID PRIMARY KEY)
   - Columns: `user_id` (UUID references `users_profile.id`), `split_name`, `started_at`, `is_completed`.
   - Security: RLS enabled. Full CRUD restricted to `auth.uid() = user_id`.
4. **`workout_sets`** (`id` UUID PRIMARY KEY)
   - Columns: `session_id` (UUID references `workout_sessions.id` ON DELETE CASCADE), `exercise_id`, `set_index`, `weight_kg`, `reps`, `is_checked`.
   - Security: RLS restricted to sessions owned by `auth.uid()`.
5. **`nutrition_logs`** (`id` UUID PRIMARY KEY)
   - Columns: `user_id`, `food_name`, `calories`, `protein`, `carbs`, `fats`, `created_at`.
   - Security: RLS restricted to `auth.uid() = user_id`.
6. **`body_weight_logs`** (`id` UUID PRIMARY KEY)
   - Columns: `user_id`, `weight_kg`, `created_at`.
   - Security: RLS restricted to `auth.uid() = user_id`.
8. **`payment_requests`** (`id` UUID PRIMARY KEY)
   - Columns: `user_id` (UUID references `users_profile.id`), `user_name`, `user_email`, `plan` ('monthly' | 'yearly'), `amount` (NUMERIC), `proof_image_url` (TEXT), `status` ('pending' | 'approved' | 'rejected'), `created_at`, `reviewed_at`.
   - Security: RLS enabled. Users can SELECT & INSERT their own records. Admin approval is handled via Telegram webhook + atomic RPC `approve_payment_request`.

### Custom Stored Functions & RPCs
- `approve_payment_request(request_id UUID) -> JSONB`: Approves pending payment, sets `status = 'approved'`, and activates user's `is_premium = true` + `premium_until` (1 month or 1 year) under `SECURITY DEFINER`.
- `reject_payment_request(request_id UUID) -> JSONB`: Rejects pending payment under `SECURITY DEFINER`.
- `redeem_promo_code(input_code TEXT) -> JSONB`: Atomic promo validation, user assignment, and 10-year premium provisioning under `SECURITY DEFINER`.
- `get_global_leaderboard() -> TABLE(...)`: Aggregates volume, workout count, and active streaks (`LIMIT 50`).
- `search_users(search_query TEXT) -> TABLE(...)`: Searches lifters by username/name with volume and streaks (`LIMIT 20`).
- `get_email_by_username(lookup_username TEXT) -> TEXT`: Secure email resolver for username login flow.

---

## 4. Key Architectural Patterns & Files

```
c:\xampp\htdocs\GYM/
├── App.js                   # Root provider tree, tab navigator, session management, workout state sync
├── supabaseClient.js        # Supabase client initialization, safe query wrappers (safeSelect, safeInsert)
├── theme.js                 # Global palette (#CCFF00, #000000), typography, and standard styles
├── .env                     # Environment keys (EXPO_PUBLIC_GEMINI_API_KEY, SUPABASE_URL, ANON_KEY)
├── components/
│   ├── AdaptiveLayout.js    # Viewport breakpoint router (< 768px Mobile vs ≥ 768px PC Landing/Admin)
│   ├── AIRoutineModal.js    # AI routine builder dialog
│   ├── MuscleRecoveryMap.js # SVG body map rendering 12 muscle groups with recovery decay engine
│   ├── NutritionWidget.js   # Daily macro tracker ring + meal logging preview
│   └── SkiaProgressRing.js  # Hardware-accelerated circular progress ring
├── contexts/
│   ├── AppModeContext.js    # Adaptive Engine: Gym Mode vs Home Mode + equipment inventory filter
│   ├── DynamicIslandContext.js # Floating pill alert overlay & live workout status
│   ├── LanguageContext.js   # Localization provider (ID / EN)
│   └── ThemeContext.js      # AMOLED dark theme context
├── hooks/
│   ├── useAdaptiveUI.js     # Dynamically alters UI labels/tools based on gym vs home mode
│   └── useProfileData.js    # Fetches & caches user stats, streaks, and weight logs
├── screens/
│   ├── AuthScreen.js        # Login & Signup with username/email regex validation
│   ├── DashboardScreen.js   # Main hub: volume stats, routine launcher, leaderboard, offline sync HUD
│   ├── LibraryScreen.js     # Exercise catalogue (dynamic filter by home equipment)
│   ├── LoggerScreen.js      # Active workout tracker with TTS audio coach and AsyncStorage restore
│   ├── HistoryScreen.js     # Calendar multi-tab history (Workouts, Nutrition, Hydration)
│   ├── ProfileScreen.js     # Body metrics, recovery overview, trophies, settings
│   ├── AIChatBubble.js      # Floating AI Coach for advice & conversational logging
│   ├── AIMealPlanModal.js   # Calorie/macro meal plan generator
│   ├── NutritionScannerModal.js # Camera nutrition label scanner
│   ├── AdminDashboard.js    # Desktop Admin Control Panel (role === 'admin')
│   ├── LandingPage.js       # Desktop Cinematic Guest Landing Page
│   └── PaywallScreen.js     # Subscription plans & promo code redemption
└── api/
    └── analyze-nutrition.js # Vercel serverless proxy for Gemini food image classification
```

---

## 5. Storage Keys Namespace Standard (AsyncStorage)

To prevent data collision between different logged-in users or guest sessions, all user-scoped storage keys MUST append `${userId}`:
- Active Workout State: `active_workout_data_${userId}`, `active_workout_index_${userId}`, `active_workout_start_time_${userId}`
- Offline Sync Queue: `offline_workouts_${userId}`
- Muscle Recovery Overrides: `muscle_recovery_overrides_${userId}`
- Premium Status Cache: `@premium_status_${userId}`, `is_premium_${userId}`, `premium_until_${userId}`
- Equipment Inventory: `@gymvault_equipment_inventory` (Global device setting)
- Onboarding Flag: `has_seen_onboarding`

---

## 6. Non-Negotiable Engineering Rules (The 7 Pillars)

1. **Ponytail Minimalist Rule**: Always follow the ladder (YAGNI > Re-use > Stdlib > Native Platform > Existing Dep > Minimal 1-liner). Never write 50 lines of wrapper when standard HTML5/React Native components suffice.
2. **Strix Zero-Trust Security**: Never trust client inputs. Always enforce Supabase RLS. Never bypass auth checks or expose secret keys (`service_role`).
3. **No Hardcoded Credentials**: API keys (Gemini, Supabase, etc.) must NEVER be hardcoded into JavaScript files. Use environment variables.
4. **AMOLED Design Integrity**: Pitch black `#000000`, surface `#111111`, electric green `#CCFF00`. No generic white backgrounds or plain unstyled buttons.
5. **Separation of Concerns**: Keep business logic inside hooks/services and UI in components. Files should aim to stay modular (< 300-400 lines where practical).
6. **Cross-Platform Safety**: Always verify `Platform.OS === 'web'` when using browser APIs (`window`, `navigator`) or native modules (`AsyncStorage`, `ImagePicker`, `Notifications`).
7. **Complete Output Enforcement**: Never truncate code with placeholders like `// ... rest of code unchanged`. Always provide exact, complete code blocks.
