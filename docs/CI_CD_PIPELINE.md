# GymVault CI/CD Pipeline & Quality Gate Documentation

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Overview

GymVault enforces a multi-layer verification pipeline ensuring that code committed to origin/main is mathematically sound, cryptographically validated, type-safe, and free from regression bugs.

Pipeline Layers:
1. Local Workstation: Pre-push git hooks (.githooks/pre-push) running 80 automated unit assertions.
2. Cloud Continuous Integration: GitHub Actions (.github/workflows/ci.yml) running on Node.js 22 LTS.
3. Edge Continuous Delivery: Vercel automated deployments with preview branching and atomic instant rollbacks.

---

## 2. GitHub Actions Workflow (.github/workflows/ci.yml)

The workflow executes on every push and pull request targeting the main branch:

### Steps Executed:
1. actions/checkout@v4: Clones the exact commit SHA with full history.
2. actions/setup-node@v4: Configures Node.js 22 LTS with npm package caching enabled to reduce build times.
3. Dependency Installation: Executes npm ci --ignore-scripts to guarantee reproducible, zero-compromise dependency resolution.
4. Type-Safety Verification: Runs npm run typecheck (tsc --noEmit) to validate TypeScript types across components, screens, and services.
5. Automated Test Assertion Suite: Runs npm test, evaluating all 17 test suites (80 assertions) covering fitness math, plate algorithms, and DOKU HMAC verification.

---

## 3. Local Git Pre-Push Hook Architecture

Located at .githooks/pre-push and configured via:
```bash
git config core.hooksPath .githooks
```

Behavior:
- Intercepts git push before network socket transmission.
- Runs npm test in the active environment.
- If any assertion fails, terminates with exit code 1 and aborts the push.
- If all assertions pass, prints confirmation banner and proceeds with push.

---

## 4. Vercel Production Deployment Lifecycle

Upon successful GitHub merge:
1. Vercel Edge detects origin/main commit trigger.
2. Serverless functions in /api/ compile to Edge lambdas.
3. Static files in web/ and public/ are synced across Vercel Global Edge CDN.
4. Security response headers (HSTS, nosniff, SAMEORIGIN, Permissions-Policy) are attached automatically to every edge response.
5. In-memory IP rate limiter activates on /api/doku-checkout.
