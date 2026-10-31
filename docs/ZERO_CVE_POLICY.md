# GymVault Modern Runtime & Zero-CVE Policy

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Runtime Version Standards

GymVault strictly enforces modern active Long Term Support (LTS) runtimes across all local, CI, container, and cloud deployment targets. The use of deprecated, end-of-life, or vulnerable runtimes is prohibited.

Enforced Runtimes:
- Node.js: Minimum Node >= 20.x or >= 22.x LTS (Project Pinned: Node.js 22 LTS via .nvmrc).
- React: React 19.1.0 with strict hook invariants.
- React Native: 0.81.5 with React 19 native arch support.
- Expo SDK: 54.0.0+ (Latest active stable release).
- PostgreSQL: Supabase Postgres 15+ with pg_graphql and pg_stat_statements.

---

## 2. Dependency Audit & Vulnerability Tolerance

GymVault maintains a strict Zero Critical and High CVE tolerance for production dependencies:

1. Automatic Audit Quality Gate
Every build and dependency modification must be verified via:
```bash
npm run audit:cve
```

2. Configuration File Enforcement
- .npmrc: Specifies engine-strict=true. If a developer attempts to install or run the project on Node 18 or older, npm immediately terminates execution with an error.
- .nvmrc: Pinned to version 22 to ensure automatic toolchain alignment.

3. Lockfile Integrity
- package-lock.json is committed to version control and must remain synchronized with package.json.
- CI pipelines execute npm ci --ignore-scripts to prevent unvetted third-party install scripts from executing during build.

---

## 3. Vulnerability Remediation SLA

When a security advisory is published affecting a direct dependency:
- Critical CVE: Patch or replacement within 24 hours.
- High CVE: Patch or replacement within 72 hours.
- Moderate / Low CVE: Evaluated and remediated during the next bi-weekly release cycle.
