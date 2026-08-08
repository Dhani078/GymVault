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

## 5. The Adaptive Platform Strategist (Cross-Platform & PC Engine)
- Focus: Device detection, Desktop UI, Landing Pages, Admin Portals.
- Task: Managing responsive viewport breakpoints, role-based desktop UI routing, and Vercel web performance.
- When to use: Implementing PC Landing Page, Admin Analytics Dashboard, or cross-platform responsive logic.

---
# CURRENT PROJECT CONTEXT: "The Adaptive Engine & Desktop Web Integration"
- **Adaptive Engine (Mobile)**: Gym Mode vs. Home Mode seamlessly toggled via `AppModeContext`.
- **PC Web & Desktop Integration**: Unified Vercel URL serving:
  1. *Mobile (HP)*: Mobile App (Auth required).
  2. *Desktop Guest (PC)*: High-End Cinematic Landing Page.
  3. *Desktop Admin (PC)*: Admin Control Panel & User Analytics Dashboard (`role === 'admin'`).
@CLAUDE.md
@GYMVAULT_CONTEXT.md