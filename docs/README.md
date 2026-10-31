# GymVault Engineering Documentation Index

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## Overview

This directory houses the comprehensive architectural, mathematical, security, and operational documentation for the GymVault fitness platform.

---

## Documentation Directory

### 1. Core Architecture & System Design
- [docs/ARCHITECTURE.md](ARCHITECTURE.md): System topology, component tree, responsive breakpoint engine, and cross-platform routing.
- [docs/DATABASE_SCHEMA.md](DATABASE_SCHEMA.md): PostgreSQL relational diagram, Row Level Security (RLS) policies, triggers, and B-Tree indexes.
- [docs/OFFLINE_SYNC_ENGINE.md](OFFLINE_SYNC_ENGINE.md): Storage partitioning, local optimistic writes, and FIFO synchronization protocol.
- [docs/PWA_AND_EDGE_ENGINE.md](PWA_AND_EDGE_ENGINE.md): Web manifest, service worker caching tiers, and Vercel Edge security headers.

### 2. Mathematics, Biomechanics & AI
- [docs/FITNESS_ENGINE.md](FITNESS_ENGINE.md): Pure functional algorithms for 1RM, Olympic plates, Karvonen HR zones, and overload.
- [docs/ANATOMY_TAXONOMY.md](ANATOMY_TAXONOMY.md): 12 primary muscle groups, Latin taxonomy, CNS recovery decay curves, and kinetic chain rules.
- [docs/NUTRITION_AND_MEAL_PLANNER.md](NUTRITION_AND_MEAL_PLANNER.md): Mifflin-St Jeor TDEE formulas, macro splits, and Gemini Vision AI meal scanning.
- [docs/VOICE_LOGGER_SPECIFICATION.md](VOICE_LOGGER_SPECIFICATION.md): Web Speech API speech-to-intent grammar and hands-free audio loop.

### 3. Payment Gateway, Security & Operations
- [docs/PAYMENT_GATEWAY.md](PAYMENT_GATEWAY.md): DOKU QRIS checkout flow, timing-safe HMAC SHA-256 verification, and atomic database settlement.
- [docs/SECURITY_AUDIT.md](SECURITY_AUDIT.md): Penetration testing report, OWASP Top 10 evaluation, and client-side secret audit.
- [docs/INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md): Emergency playbooks for gateway downtime, database outages, and key rotation.
- [docs/TELEGRAM_ADMIN_BOT.md](TELEGRAM_ADMIN_BOT.md): SaaS command center syntax, instant QRIS approval, and telemetry commands.
- [docs/SUPER_ADMIN_MANUAL.md](SUPER_ADMIN_MANUAL.md): Web admin dashboard manual, user management, and promo code distribution.

### 4. Testing, Benchmarks & Quality Assurance
- [docs/TESTING_STRATEGY.md](TESTING_STRATEGY.md): Comprehensive breakdown of all 17 automated test suites (80 assertions).
- [docs/BENCHMARKS_AND_PERFORMANCE.md](BENCHMARKS_AND_PERFORMANCE.md): FlashList recycling efficiency, execution latency, and Core Web Vitals.
- [docs/CI_CD_PIPELINE.md](CI_CD_PIPELINE.md): GitHub Actions workflow, git pre-push quality gates, and automated validation.
- [docs/ZERO_CVE_POLICY.md](ZERO_CVE_POLICY.md): Active LTS runtime standards and dependency vulnerability remediation SLA.

### 5. Deployment, Containerization & Roadmap
- [docs/DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md): Standard Operating Procedure for Vercel Web and Expo EAS Mobile distribution.
- [docs/DOCKER_CONTAINER_GUIDE.md](DOCKER_CONTAINER_GUIDE.md): Multi-stage non-root Alpine Docker deployment and reverse proxy configuration.
- [docs/APP_STORE_RELEASE_NOTES.md](APP_STORE_RELEASE_NOTES.md): Bilingual release notes for Google Play Console and Apple App Store.
- [docs/ROADMAP.md](ROADMAP.md): Product and engineering roadmap from v2.5 to v3.0.
- [docs/openapi.yaml](openapi.yaml): Formal OpenAPI 3.1.0 contract specification for serverless edge endpoints.
