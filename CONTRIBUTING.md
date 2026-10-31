# Contributing to GymVault

Thank you for your interest in GymVault! This project is maintained with uncompromising standards regarding performance, code cleanliness, and security.

## Core Rules & Architecture Standards

1. Lead Maintainer: This project is maintained exclusively by Dhani078. External contributions must strictly adhere to project architecture and coding standards.
2. Zero-CVE Runtime Policy: All dependencies and environments must use the latest active LTS versions (Node.js >= 22.x LTS). Deprecated runtimes or high/critical CVEs are prohibited.
3. 100% Test Pass Guarantee: Every change must pass all automated test suites (`npm test` — 71/71 assertions passing) before pushing or merging. Pre-push git hooks enforce this requirement.
4. Clean Code & Anti-Slop:
   - Files should ideally be modular (< 200–300 lines of code).
   - No empty catch blocks (`try/catch` must log or handle exceptions explicitly).
   - Pure functional mathematics in `utils/fitnessMath.js` (zero side effects).
5. Design System & Visual Consistency:
   - AMOLED Pitch Black (`#000000`) background and Electric Lime (`#D4F53C`) accent colors.
   - Text muted standard: `#909096` for WCAG 2.2 AA contrast compliance.
   - Vector icons via `lucide-react-native` (no raw emoji buttons in interactive controls).
6. Git Workflow:
   - Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `ci:`).
   - Ensure working tree is clean and builds without warnings before submitting PRs.

## Local Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suites (Fitness Math + DOKU QRIS)
npm test

# 3. Start local development server
npm run web
# or for mobile:
npx expo start

# 4. Run database healthcheck
npm run healthcheck:db
```
