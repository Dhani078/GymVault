# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# GymVault Project Agents

## 1. The Architect (System Design)
- Focus: Structure, Scalability, and Clean Architecture.
- Task: Defining global state, Context providers, and data models.
- When to use: Starting new features or major refactoring.

## 2. The UI/UX Ninja (Design System)
- Focus: Pixel-perfect, AMOLED design, Animations, User flow.
- Task: Styling components, Framer Motion/Reanimated logic, Glassmorphism.
- When to use: Building new screens or fixing layout issues.

## 3. The Data Whisperer (Backend/Database)
- Focus: Supabase, RLS, SQL optimization, Offline Sync (Stitch).
- Task: Writing queries, defining database schema, ensuring data integrity.
- When to use: When creating or modifying database interactions.

## 4. The QA/Debugger (Resilience)
- Focus: Error handling, edge-case analysis, testing, and performance profiling.
- Task: Preventing crashes, writing tests, fixing bugs.
- When to use: Final review of code or when something breaks.

---
# CURRENT PROJECT CONTEXT: "The Adaptive Engine"
- We are currently building the **Adaptive Engine** for GymVault (switching between Gym Mode and Home Mode).
- Key Focus: Global `AppModeContext`, Conditional UI Rendering, and Local Storage Persistence.
@CLAUDE.md
@GYMVAULT_CONTEXT.md