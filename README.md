# ⚡ GymVault — Elite Workout & Fitness Tracking Platform

> **GymVault** is a high-performance, AMOLED-styled cross-platform fitness application built with React Native (Expo SDK 54), Supabase, and Google Gemini AI. Featuring an **Adaptive Engine** that dynamically alternates between **Gym Mode** (machines & barbells) and **Home Mode** (calisthenics, bands, & dumbbells), real-time workout logging, bilingual audio coaching, computer-vision nutrition scanning, and unified single-URL desktop/mobile routing.

---

## 🌟 Key Features

- 🏋️ **Adaptive Workout Engine**: Seamlessly switch between Gym Mode and Home Mode. Exercises automatically swap to match available home inventory without losing workout structure.
- ⏱️ **Zero-Friction Live Logger**: Real-time set tracker with rest timers, checkmarks, automatic local persistence (`AsyncStorage`), and bilingual Text-to-Speech (TTS) voice coach.
- 🤖 **AI Coach & Meal Planner**: Conversational fitness assistant, macro meal planner, and workout routine generation powered by Google Gemini AI.
- 📸 **Smart Nutrition Scanner**: Camera-based nutritional label scanner for instant meal macro breakdown and calorie logging.
- 🗺️ **12-Group SVG Muscle Recovery Map**: Anatomical body heat-map with mathematical recovery decay and tailored rehabilitation exercises.
- 📴 **Offline Sync Engine**: Full offline workout tracking with auto-queueing and automatic Supabase database synchronization upon network reconnect.
- 🖥️ **Adaptive Web & Desktop Engine**:
  - **Mobile (< 768px)**: Native mobile PWA experience.
  - **PC Guest (≥ 768px)**: Cinematic product landing page with mobile preview.
  - **PC Admin (≥ 768px)**: Analytics control panel for managing users and platform activity.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://docs.expo.dev/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
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

**34 Active Skills Installed**: Caveman suite, Strix security suite, Ponytail suite, and Frontend/UI design suite.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- A [Supabase](https://supabase.com/) project

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Dhani078/GymVault.git
cd GymVault

# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Database Setup
1. Open your **Supabase Dashboard → SQL Editor**.
2. Run the queries from `setup_database.sql` to initialize tables, RLS policies, and RPC functions.
3. Run `fix_security_patches.sql` to apply the latest security triggers and secure promo code redemption.

### 5. Running the Application
```bash
# Start Expo development server (interactive menu)
npx expo start

# Run on Web (Browser)
npm run web

# Run on Android Emulator / Physical Device
npm run android

# Run on iOS Simulator
npm run ios
```

---

## 📁 Repository Structure

```
├── App.js                   # Root provider tree & navigation hub
├── supabaseClient.js        # Supabase client with safe query helpers
├── theme.js                 # Global tokens (#000000 Pitch Black, #CCFF00 Electric Green)
├── components/              # Reusable UI components & modals
│   ├── AdaptiveLayout.js    # Responsive viewport router (Mobile vs PC Landing/Admin)
│   ├── MuscleRecoveryMap.js # SVG body recovery heat-map
│   └── NutritionWidget.js   # Macro tracking ring & meal logger preview
├── contexts/                # State providers (AppMode, Theme, Language, DynamicIsland)
├── hooks/                   # Custom business logic hooks (useAdaptiveUI, useProfileData)
├── screens/                 # Application screen views (Dashboard, Logger, Library, etc.)
├── api/                     # Serverless backend functions (analyze-nutrition.js)
├── .agents/                 # AI Skills & Security Rules (Ponytail + Strix)
├── MEMORY.md                # Master AI Context & Invariant Ledger
├── AGENTS.md                # Agent Roster & Rules Map
├── CLAUDE.md                # Staff Engineer Coding Standards
└── GYMVAULT_CONTEXT.md      # In-depth Architecture & Feature Specifications
```

---

## 🛡️ Security & Quality Architecture

- **Row Level Security (RLS)**: Enforced across 100% of Supabase tables.
- **Zero Hardcoded Secrets**: Client uses dynamic environment variables only.
- **AI Agent Tooling**: Protected by **Strix** (Automated Pentesting) and **Ponytail** (Anti-Overengineering) agent rules.

---

## 📄 License
Private / Proprietary — All rights reserved by GymVault.
