# GymVault Architecture & System Design Specification

> Master architectural blueprint for GymVault cross-platform fitness platform.  
> Author: **Dhani078**  
> Version: **2.4.0**  
> Status: **Production Ready**

---

## 1. High-Level Architecture Overview

GymVault is engineered as a unified cross-platform application deployed as both a Progressive Web App (PWA) on Vercel and a native mobile build via Expo EAS (Android / iOS). The architecture enforces strict separation of concerns across presentation, business logic, pure mathematical calculation, and persistence.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT PRESENTATION TIER                              │
│                                                                                 │
│   ┌──────────────────────────┐             ┌────────────────────────────────┐   │
│   │     Mobile Viewport      │             │        Desktop Viewport        │   │
│   │        (< 768px)         │             │           (≥ 768px)            │   │
│   ├──────────────────────────┤             ├────────────────────────────────┤   │
│   │ • AMOLED Mobile UI       │             │ • Cinematic Landing Page       │   │
│   │ • Active Logger Screen   │             │ • 7 Interactive Simulators     │   │
│   │ • Exercise Library       │             │ • Super-Admin Control Panel    │   │
│   │ • Athlete Profile Hub    │             │ • Floating View Switcher       │   │
│   └─────────────┬────────────┘             └───────────────┬────────────────┘   │
│                 │                                          │                    │
│                 └────────────────────┬─────────────────────┘                    │
│                                      ▼                                          │
│                      AdaptiveLayout Router (Breakpoint Engine)                 │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│                           STATE & CONTEXT TIER                                  │
│                                                                                 │
│  • AppModeContext (Gym vs Home Mode equipment filter)                           │
│  • ThemeContext (AMOLED #000000 & Electric Lime #D4F53C)                        │
│  • LanguageContext (Indonesian / English localization)                          │
│  • DynamicIslandContext (Persistent HUD & Active Rest Timer)                    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────────┐
│                      PURE ENGINE & UTILITY MODULES                              │
│                                                                                 │
│  • utils/fitnessMath.js (1RM, Olympic Plates, TDEE, Karvonen HR, CNS Decay)    │
│  • utils/dateHelpers.js (Canonical WIB date manipulation & week bounds)         │
│  • services/dokuService.js (HMAC-SHA256 signature generator & verification)     │
│  • services/NutritionDataset.js (USDA + Indonesian food nutritional database)   │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│         LOCAL PERSISTENCE TIER        │ │         EDGE & SERVERLESS TIER        │
│                                       │ │                                       │
│ • AsyncStorage Namespace Vault        │ │ • api/doku-checkout.js                │
│ • Offline Workout Mutation Queue      │ │ • api/doku-webhook.js                 │
│ • Cached PRs & Weight History         │ │ • api/telegram-webhook.js             │
│ • Image & Biometric Cache             │ │ • api/analyze-nutrition.js            │
└───────────────────┬───────────────────┘ └───────────────────┬───────────────────┘
                    │                                         │
                    └──────────────────┬──────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL BACKEND SERVICES                              │
│                                                                                 │
│   ┌──────────────────────────┐             ┌────────────────────────────────┐   │
│   │    Supabase Postgres     │             │     DOKU Payment Gateway       │   │
│   │  (RLS, Auth, Storage,    │             │  (Instant QRIS Merchant Host,  │   │
│   │   Atomic RPC Procedures) │             │   Settlement Notification)     │   │
│   └──────────────────────────┘             └────────────────────────────────┘   │
│   ┌──────────────────────────┐             ┌────────────────────────────────┐   │
│   │  Telegram Bot Platform   │             │   Google Gemini API Cascade    │   │
│   │  (Real-Time SaaS Alerts, │             │  (Vision Meal Scanner,         │   │
│   │   Admin Approval Inline) │             │   AI Coach Waterfall)          │   │
│   └──────────────────────────┘             └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure Conventions

The repository follows a strict modular structure to maintain file lengths below maintainable thresholds and prevent cross-boundary pollution:

```text
E:\Hermesproject\GYM\
├── api/                    # Vercel serverless edge functions
│   ├── analyze-nutrition.js   # Food image OCR & macronutrient classifier
│   ├── doku-checkout.js       # DOKU official QRIS checkout generator
│   ├── doku-webhook.js        # DOKU HMAC-SHA256 verified settlement listener
│   ├── generate-routine.js    # AI routine synthesis endpoint
│   ├── payment-notify.js      # Telegram receipt forwarder
│   ├── qiospay-callback.js    # Secondary QRIS settlement listener
│   └── telegram-webhook.js    # 2-way admin bot command router
├── components/             # Reusable UI component suites
│   ├── admin/                 # Super-admin management tables & metrics
│   ├── history/               # Session inspection modals & volume charts
│   ├── landing/               # Desktop landing page sections & interactive demos
│   ├── logger/                # Plate calculator, rest timer, summary modals
│   ├── profile/               # Athlete profile, settings, TDEE, redeem modals
│   ├── AdaptiveLayout.js      # Responsive viewport engine (< 768px vs ≥ 768px)
│   ├── MuscleRecoveryMap.js   # 12-group SVG anatomical recovery map
│   ├── NutritionWidget.js     # Daily macro tracker ring + meal logger
│   └── SkiaProgressRing.js    # Hardware-accelerated SVG/Skia rings
├── contexts/               # React Context state providers
│   ├── AppModeContext.js      # Gym Mode vs Home Mode state & inventory
│   ├── DynamicIslandContext.js# Persistent workout HUD alert system
│   ├── LanguageContext.js     # Localization dictionary (ID / EN)
│   └── ThemeContext.js        # AMOLED tokens & dark mode controller
├── docs/                   # Master engineering documentation
├── hooks/                  # Encapsulated stateful business logic
│   ├── useAdaptiveUI.js       # Window dimension listeners & orientation hooks
│   ├── useAdminData.js        # Super-admin metrics & member fetcher
│   └── useProfileData.js      # Athlete profile data & privilege verification
├── screens/                # Root screen controllers
│   ├── AdminDashboard.js      # Desktop web analytics control room
│   ├── AIMealPlanModal.js     # AI Meal Planner & Smart Fridge Chef
│   ├── AuthScreen.js          # Authentication (Email, Username, Session)
│   ├── DashboardScreen.js     # Athlete central hub & routine launcher
│   ├── HistoryScreen.js       # Multi-tab workout, food, and hydration log
│   ├── LandingPage.js         # Cinematic desktop product showcase
│   ├── LibraryScreen.js       # Biomechanical exercise library & plateau cues
│   ├── LoggerScreen.js        # Active workout tracker & hands-free voice engine
│   ├── NutritionScannerModal.js # Visual food scanner
│   ├── PaywallScreen.js       # DOKU QRIS checkout & subscription manager
│   └── ProfileScreen.js       # Bio-metrics, streak calendar, trophy room
├── services/               # External service adapters & helpers
│   ├── dokuService.js         # DOKU cryptographic HMAC & checkout client
│   ├── geminiService.js       # 7-tier model cascade adapter
│   ├── LiveActivityManager.js # Native background rest timer manager
│   ├── NotificationManager.js # Scheduled local push notification manager
│   └── NutritionDataset.js    # Local nutritional database & cache
├── utils/                  # Pure mathematical & helper modules
│   ├── dateHelpers.js         # WIB canonical date arithmetic
│   ├── fitnessMath.js         # Pure functional fitness algorithms
│   └── makeId.js              # Cryptographic short ID generator
└── scripts/                # Automated audit, test, and verification tools
    ├── audit-chrome.mjs       # Headless Chrome CDP visual regression test
    ├── test-fitness-engine.js # Automated unit test suite (61 assertions)
    └── test-doku.js           # DOKU QRIS HMAC & validation suite (4 assertions)
```

---

## 3. Responsive Breakpoint Engine

GymVault uses a single unified URL (`https://gymvault-app.vercel.app`) that dynamically delivers optimized layouts based on device characteristics:

```javascript
// Rule: Viewport width evaluated dynamically via Dimensions / window listener
const isDesktop = width >= 768;

if (!isDesktop) {
  // Mobile Container: PWA wrapper bounded to 100% viewport width
  return <MobileAppNavigationContainer />;
} else {
  // Desktop Container: Delivers Landing Page or Super-Admin Dashboard
  // Includes floating switcher for manual preview override
  return <DesktopViewportContainer currentMode={previewMode} />;
}
```

### Desktop Modes:
1. **Public Guest (`role !== 'admin'`):** Displays cinematic landing page with dark aesthetic, typography, and seven client-side interactive calculators (1RM, Olympic Plates, TDEE, Karvonen Zones, CNS Decay, Fridge Chef, Voice Simulator).
2. **Super-Admin (`role === 'admin'`):** Grants access to Admin Control Panel with revenue tracking, user management, and instant payment approval tools.
3. **Floating View Switcher:** Enables seamless switching between `[ Landing Page ]`, `[ Admin Panel ]`, and `[ App View ]` without signing out.

---

## 4. State Management Architecture

State is segregated into three distinct domains:

1. **Transient UI State:** Controlled locally within components via `useState` and `useReducer` (e.g., active modal visibility, input fields, form validation).
2. **Global Application State:** Orchestrated via React Contexts:
   - `AppModeContext`: Persists selected equipment inventory (`dumbbells`, `resistance_band`, `pullup_bar`, `bench`) and toggles between Gym and Home exercise variations.
   - `ThemeContext`: Exposes canonical design tokens (`#000000`, `#0E0E12`, `#16161A`, `#D4F53C`, `#909096`) ensuring zero style drift.
   - `DynamicIslandContext`: Coordinates active rest timer countdowns and floating notifications across screens.
3. **Persistent Server & Local State:**
   - Active workout draft, custom routines, and offline queue are stored in `@react-native-async-storage/async-storage` using user-scoped keys: `${key}_${userId}`.
   - Authoritative historical logs, athlete profiles, and payment records reside in Supabase PostgreSQL with strict Row Level Security.

---

## 5. Offline-First Mutation Pipeline

GymVault maintains continuous usability during gym network dropouts via an offline-first architecture:

1. **Write Phase:** When logging a completed workout session, `LoggerScreen.js` attempts direct insertion to Supabase.
2. **Catch & Queue Phase:** If a network error, timeout, or DNS failure is intercepted, the complete payload is serialized into `offline_workouts_${userId}` in AsyncStorage.
3. **Optimistic UI:** The session immediately marks complete in the client UI, updating local streak counters and volume aggregates.
4. **Reconnection & Drain Phase:** `OfflineSyncBanner.js` monitors network connectivity. Upon detection of active internet, pending sessions are replayed sequentially to Supabase using `safeInsert` and `safeBatchInsert` procedures, draining the queue and notifying the user upon completion.
