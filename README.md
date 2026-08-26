# ⚡ GymVault — Elite Workout & Fitness Tracking Platform

> **GymVault** is a certified 10/10 production-grade, AMOLED-styled cross-platform fitness application built with React Native (Expo SDK 54), Supabase, and Google Gemini 3.7 AI. Featuring an **Adaptive Engine** that dynamically alternates between **Gym Mode** (machines & barbells) and **Home Mode** (calisthenics, bands, & dumbbells), hands-free voice-activated workout logging, bilingual audio coaching, computer-vision nutrition scanning, automated verification test suites (`npm test` - 61/61 passing), and unified single-URL desktop/mobile routing with live interactive simulators.

---

## 🌐 Live Production URL
👉 **[https://gymvault-app.vercel.app](https://gymvault-app.vercel.app)**

---

## 🌟 Key Features

- 🏋️ **Adaptive Workout Engine**: Seamlessly switch between Gym Mode and Home Mode. Exercises automatically swap to match available home inventory without losing workout structure.
- 🎙️ **Voice-Activated Hands-Free Workout Logging**: Speak natural voice commands (*"Coach, catat 80 kilo 8 repetisi"*) while holding heavy dumbbells. Uses Web Speech API to parse weight/reps, mark sets complete, and trigger dynamic rest timers.
- ⏱️ **Zero-Friction Live Logger**: Real-time set tracker with progressive overload double progression, back-off set recommendations, kinetic chain fatigue warnings, local persistence (`AsyncStorage`), and bilingual Text-to-Speech (TTS) voice coach.
- 🍳 **"Fridge-to-Macro" Smart Chef**: Generate gram-precise recipes and ingredient portions from whatever is currently in the kitchen fridge, perfectly matching remaining daily calorie and protein targets.
- 🤖 **Google Gemini 3.7 Multi-Model Cascade**: Conversational fitness assistant, macro meal planner, workout routine generation, and anti-fraud payment receipt audits powered by a 7-model fallback waterfall (`3.7-flash` ➔ `3.6` ➔ `3.5` ➔ `3.1` ➔ `2.5` ➔ `2.5-lite` ➔ `1.5-flash`).
- 📸 **Smart Nutrition Scanner**: Camera-based nutritional label scanner for instant meal macro breakdown and calorie logging.
- 🗺️ **12-Group SVG Muscle Recovery Map**: Anatomical body heat-map with mathematical recovery decay, multilingual scientific taxonomy, and tailored rehabilitation exercises.
- 🧮 **Pure Mathematical Engine (`utils/fitnessMath.js`)**: Isolated, zero-side-effect modules for 1RM (Brzycki), Olympic Barbell Plate Loading (IPF/IWF bumper plates), TDEE (Mifflin-St Jeor), Cardio HR Zones (Karvonen), Kinetic Chain Stabilizer Protection, and 4-Week Plateau Breakers.
- 🧪 **Automated Test Runner (`npm test`)**: 61 automated assertion test scenarios across 14 test suites verifying calculation accuracy and data taxonomy with a 100% pass rate.
- 📴 **Offline Sync Engine**: Full offline workout tracking with auto-queueing and automatic Supabase database synchronization upon network reconnect.
- 🤖 **Super-Admin Telegram Bot Command Suite (`api/telegram-webhook.js`)**: Real-time SaaS control center from Telegram chat supporting `/stats`, `/growth`, `/recent`, `/check <email>`, `/grant <email> <days>`, `/revoke <email>`, `/broadcast <msg>`, and `/clearnotif` + instant inline `[ ✅ ACC ]` / `[ ❌ TOLAK ]` QRIS approval.
- 🖥️ **Adaptive Web & Desktop Engine (with Desktop View Mode Switcher)**:
  - **Mobile (< 768px)**: Native mobile PWA experience.
  - **PC Guest (≥ 768px)**: Cinematic product landing page with 7 live interactive simulators (1RM, Olympic Plates, TDEE, HR Zones, CNS Decay, Fridge Chef Sandbox, Voice Logger Simulator).
  - **PC Admin (≥ 768px)**: Analytics control panel for managing users and platform activity.
  - **Floating View Switcher**: 1-click toggle between `[ 🌐 Landing Page ]`, `[ 👑 Admin Panel ]`, and `[ 📱 App View ]`.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://docs.expo.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & Storage)
- **High-Performance Lists**: `@shopify/flash-list`
- **Hardware-Accelerated Graphics**: `@shopify/react-native-skia`
- **Animations**: `react-native-reanimated` & `moti`
- **Icons**: `lucide-react-native`
- **AI Integration**: Google Gemini 3.7 / 3.6 / 3.5 / 2.5 Flash Multi-Model Cascade
- **Audio & Speech**: `expo-speech` & Web Speech Recognition API
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

# Run Automated Test Suite (61 assertions)
npm test

# Run Server for Mobile / Expo Go
npx expo start

# Run Local Telegram Bot Polling Daemon (Optional)
node scripts/start-telegram-bot.js
```

---

## 📄 License
MIT License © 2026 GymVault Inc. Engineered by Dhani078.
