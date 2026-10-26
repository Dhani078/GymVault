# GymVault Changelog

All notable changes to the GymVault project are documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), adhering to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  
Maintained by: **Dhani078**

---

## [2.4.0] - 2026-10-26

### Added
- **Official DOKU QRIS Payment Gateway**: Direct integration with DOKU Checkout API (`services/dokuService.js`, `api/doku-checkout.js`, `api/doku-webhook.js`).
- **Timing-Safe HMAC Verification**: Constant-time `crypto.timingSafeEqual` comparison on all incoming payment notifications to eliminate timing attack vectors.
- **Client Real-Time Payment Polling**: 3-second automated polling loop in `screens/PaywallScreen.js` detecting instant transaction settlement.
- **Automated DOKU Test Suite**: Added `scripts/test-doku.js` validating signature creation, timing-safe verification, body tampering rejection, and signature forgery rejection (65/65 total assertions passing).
- **Automated Headless Chrome Visual Capture**: Updated `scripts/audit-chrome.mjs` to auto-capture multi-viewport PNG artifacts to `artifacts/` during CDP runs.
- **Comprehensive Master Documentation Suite**: Added `docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_DOCUMENTATION.md`, `docs/FITNESS_ENGINE.md`, `docs/PAYMENT_GATEWAY.md`, `docs/DEPLOYMENT_GUIDE.md`, and `docs/SECURITY_AUDIT.md`.

### Changed
- **Visual Design Standard**: Unified brand accent color across all 22 components, `theme.js`, and `web/index.html` to Electric Lime (`#D4F53C` / `rgba(212, 245, 60, *)`), eliminating residual stabilo variants (`#CCFF00`).
- **WCAG 2.2 AA Contrast Compliance**: Updated low-contrast muted labels (`#666`) on AMOLED pitch black backgrounds to `#909096` (`theme.colors.textMuted`), ensuring crystal clear legibility.
- **Pure Vector Icons**: Replaced 35+ raw unicode emojis in buttons, tab bars, and modal controls with clean monochrome Lucide SVG icons (`Utensils`, `Droplet`, `Flame`, `Trash2`, `RotateCcw`, `Edit3`).
- **Clean Editorial Design**: Purged 11 repetitive capsule mini-kicker pill badges and sparkle icons across landing page section headings to eradicate AI template slop.

### Fixed
- **Inline `require()` Anti-Pattern**: Lifted dynamic `require()` statements in `DashboardScreen.js`, `LoggerScreen.js`, `ProfileScreen.js`, `OfflineSyncBanner.js`, and `CustomRoutinesWidget.js` to top-level ES module imports.
- **React Hook Order Invariant**: Removed conditional early return in `App.js` that previously executed before 7 hooks, guaranteeing 100% adherence to React 19 rules.
- **Skia Platform Segregation**: Separated `SkiaProgressRing.js` into unconditional `WebProgressRing` (SVG) and `NativeSkiaProgressRing` (Shopify Skia).
- **Undefined Identifier Crash**: Resolved `ReferenceError: splitStr is not defined` in `screens/HistoryScreen.js:295` when repeating workouts.
- **Start of Week Calculation**: Replaced manual `now.getDay()` in `DashboardScreen.js` with canonical `getStartOfWeek()` from `utils/dateHelpers.js`.

---

## [2.3.0] - 2026-10-25

### Added
- **Sub-Component Architecture**: Modularized monolith screen files into cohesive sub-directories (`components/logger/`, `components/landing/`, `components/history/`, `components/profile/`, `components/admin/`).
- **DRY Helper Centralization**: Migrated repeated local instances of `getLocalDateString` to canonical `utils/dateHelpers.js`.
- **Anti-Privilege Escalation Database Trigger**: Enforced `trg_prevent_profile_privilege_escalation` on `users_profile` preventing client-side promotion to `role = 'admin'`.

### Fixed
- **Strict Role Verification**: Removed loose email substring matching (`email.includes('admin')`) in favor of strict `role === 'admin'` checks.
- **Serverless Resource Caps**: Enforced 5 MB maximum payload on `api/analyze-nutrition.js` to prevent memory exhaustion (OWASP API4).
- **Telegram Bot Query Sync**: Aligned `workout_sessions` query filter to `started_at` instead of `created_at`.

---

## [2.2.0] - 2026-10-20

### Added
- **Responsive Desktop Landing Page**: High-end landing page for guest viewports $\ge 768\,\text{px}$.
- **7 Live Interactive Simulators**: Client-side sandboxes for 1RM, Olympic Plates, TDEE, Karvonen HR Zones, CNS Decay, Fridge Chef, and Voice Logger.
- **Desktop View Switcher**: 1-click floating bar to preview Landing Page, Admin Dashboard, and Mobile App View without authentication state disruption.
- **Super-Admin Control Room**: User analytics, transaction ledger, and volume monitoring dashboard in `screens/AdminDashboard.js`.

---

## [2.1.0] - 2026-10-15

### Added
- **Google Gemini 3.7 Cascade**: 7-tier model fallback waterfall (`3.7-flash` ➔ `3.6` ➔ `3.5` ➔ `3.1` ➔ `2.5` ➔ `2.5-lite` ➔ `1.5-flash`).
- **Smart Fridge Chef**: `screens/AIMealPlanModal.js` recipe generator utilizing available kitchen items.
- **Computer Vision Nutrition Scanner**: Visual label and meal classifier in `screens/NutritionScannerModal.js`.

---

## [2.0.0] - 2026-10-01

### Added
- **Hands-Free Voice Logger**: Web Speech API integration in `screens/LoggerScreen.js` parsing speech into weight and reps.
- **Biomechanical Audio Cues**: Bilingual Text-to-Speech coaching (`expo-speech`) announcing rest timer status and tempo guidance.
- **Double Progression Overload Engine**: Automated rep and load progression recommendations in `utils/fitnessMath.js`.
- **Olympic Plate Calculator**: Dynamic IPF/IWF bumper plate loading visualizer.

---

## [1.0.0] - 2026-09-01

### Added
- **Core Adaptive Engine**: Dynamic switching between Gym Mode and Home Mode equipment variations.
- **Supabase Integration**: PostgreSQL backend with Row Level Security and authentication.
- **Pitch Black AMOLED Theme**: High-contrast dark visual identity for OLED battery efficiency.
- **Offline Sync Pipeline**: Local workout queueing in AsyncStorage with automatic cloud synchronization.
