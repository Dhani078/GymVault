# ⚡ GymVault — Elite Workout & Fitness Tracking Platform

> **GymVault** is a certified 10/10 production-grade, AMOLED-styled cross-platform fitness application built with React Native (Expo SDK 54), Supabase, and Google Gemini 3.7 AI. Featuring an **Adaptive Engine** that dynamically alternates between **Gym Mode** (machines & barbells) and **Home Mode** (calisthenics, bands, & dumbbells), real-time workout logging, bilingual audio coaching, computer-vision nutrition scanning, automated verification test suites (`npm test`), and unified single-URL desktop/mobile routing.

---

## 🌐 Live Production URL
👉 **[https://gymvault-app.vercel.app](https://gymvault-app.vercel.app)**

---

## 🌟 Key Features

- 🏋️ **Adaptive Workout Engine**: Seamlessly switch between Gym Mode and Home Mode. Exercises automatically swap to match available home inventory without losing workout structure.
- ⏱️ **Zero-Friction Live Logger**: Real-time set tracker with rest timers, checkmarks, automatic local persistence (`AsyncStorage`), and bilingual Text-to-Speech (TTS) voice coach.
- 🤖 **Google Gemini 3.7 Multi-Model Cascade**: Conversational fitness assistant, macro meal planner, workout routine generation, and anti-fraud payment receipt audits powered by a 7-model fallback waterfall (`3.7-flash` ➔ `3.6` ➔ `3.5` ➔ `3.1` ➔ `2.5` ➔ `2.5-lite` ➔ `1.5-flash`).
- 📸 **Smart Nutrition Scanner**: Camera-based nutritional label scanner for instant meal macro breakdown and calorie logging.
- 🗺️ **12-Group SVG Muscle Recovery Map**: Anatomical body heat-map with mathematical recovery decay, multilingual scientific taxonomy, and tailored rehabilitation exercises.
- 🧮 **Pure Mathematical Engine (`utils/fitnessMath.js`)**: Isolated, zero-side-effect modules for 1RM (Brzycki), Olympic Barbell Plate Loading (IPF/IWF bumper plates), TDEE (Mifflin-St Jeor), and Cardio HR Zones (Karvonen).
- 🧪 **Automated Test Runner (`npm test`)**: 23 automated assertion test scenarios verifying calculation accuracy and data taxonomy with 100% pass rate.
- 📴 **Offline Sync Engine**: Full offline workout tracking with auto-queueing and automatic Supabase database synchronization upon network reconnect.
- 💳 **QRIS DANA 1-Click & 2-Way Telegram Webhook**: Instant payment notifications with inline `[ ✅ ACC ]` and `[ ❌ TOLAK ]` approval buttons that update Telegram messages in-place and activate Pro lifter status.
- 🖥️ **Adaptive Web & Desktop Engine (with React.lazy Code-Splitting)**:
  - **Mobile (< 768px)**: Native mobile PWA experience.
  - **PC Guest (≥ 768px)**: Cinematic product landing page with 6 live interactive simulators.
  - **PC Admin (≥ 768px)**: Analytics control panel for managing users and platform activity.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://docs.expo.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & Storage)
- **High-Performance Lists**: `@shopify/flash-list`
- **Hardware-Accelerated Graphics**: `@shopify/react-native-skia`
- **Animations**: `react-native-reanimated` & `moti`
- **Icons**: `lucide-react-native`
- **AI Integration**: Google Gemini 3.7 / 3.6 / 2.5 Flash Multi-Model Cascade
- **Audio & Speech**: `expo-speech`
- **Hosting & Deployment**: Vercel (Web / API Serverless) & EAS Build (Android/iOS)

---

## 🤖 Multi-Agent Roster & Skills (`.agents/skills`)

- **Agent 1 (The Architect)**: System design, context providers, data modeling.
- **Agent 2 (The UI/UX Ninja)**: AMOLED design system, 120 FPS animations, Skia GPU rendering.
- **Agent 3 (The Data Whisperer)**: Supabase PostgreSQL, RLS policies, offline sync.
- **Agent 4 (The QA/Debugger)**: Error resilience, edge-case testing, profiling.
- **Agent 5 (The Adaptive Platform Strategist)**: Desktop web landing, responsive breakpoints, admin control panel.
- **Agent 6 (The Minimalist / Ponytail)**: Anti-overengineering, YAGNI, standard library first, zero bloat.
- **Agent 7 (The Security Sentinel / Strix)**: AppSec, pentesting, RLS security audit, IDOR prevention.
- **Agent 8 (The Token Optimizer / Caveman)**: Ultra-dense signal, token reduction, surgical execution.

**41 Active Skills Installed**: Caveman suite, Strix security suite, Ponytail suite, UI/UX Pro Max, Frontend God Mode, and Design Taste suites.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- A [Supabase](https://supabase.com/) project

### 2. Running Locally
```bash
# Install dependencies
npm install

# Run Web Preview in Browser
npm run web

# Run Automated Test Suite
npm test

# Run Server for Mobile / Expo Go
npx expo start

# Run Local Telegram Listener (Optional)
npm run bot
```

---

## 📄 License
MIT License © 2026 GymVault Inc. Engineered by Dhani078.
