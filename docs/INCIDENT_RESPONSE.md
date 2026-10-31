# 🚨 GymVault Incident Response Runbook

> Operational procedures for engineering and system maintainers (Dhani078).  
> Standard: Severity 1 (Critical) to Severity 3 (Minor).

---

## 1. Incident Classification

| Severity | Criteria | Response Target | Example |
| -------- | -------- | --------------- | ------- |
| SEV-1 (Critical) | Core payment or database down; lifters unable to access platform. | < 15 minutes | DOKU QRIS webhook failing, Supabase connection failure. |
| SEV-2 (High) | Degraded functionality; fallback active. | < 1 hour | Gemini AI cascade failing over to heuristic routines. |
| SEV-3 (Medium) | Non-blocking issues; cosmetic or metric delays. | < 24 hours | AdSense rendering delay, avatar image upload timeout. |

---

## 2. Emergency Operational Playbooks

### Playbook A: DOKU Payment Webhook Outage / Settlement Delay
Symptom: User reports paying via QRIS but account remains Free tier.
1. Inspect Vercel serverless logs:
   ```bash
   npx vercel logs gymvault-app.vercel.app
   ```
2. Verify if DOKU webhook hit `/api/doku-webhook` with HMAC error.
3. Fallback Instant Grant via Telegram Super-Admin Bot:
   - Send Telegram command to GymVault Bot:
     ```text
     /grant user@email.com 30
     ```
   - Bot triggers atomic approval RPC and promotes athlete to PRO instantly.
4. If DOKU Gateway is under maintenance, activate manual QRIS proof upload:
   - System automatically returns `fallbackManual: true` when DOKU returns error.

### Playbook B: Supabase Database Unreachable
Symptom: API returns 500 or Healthcheck fails (`npm run healthcheck:db`).
1. Execute diagnostic healthcheck:
   ```bash
   node scripts/healthcheck-db.mjs
   ```
2. If Supabase is down, the mobile app automatically falls back to Local Offline Queue:
   - Workouts continue saving to `AsyncStorage`.
   - `OfflineSyncBanner` queues pending sets.
3. Do NOT clear local app storage while offline queue is non-zero.
4. When Supabase returns online, tap "Sync Sekarang" on banner or restart app.

### Playbook C: Secret Key Leak / Compromise
Symptom: Compromised `DOKU_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
1. Rotate secret immediately in provider dashboard (DOKU Backoffice / Supabase Settings).
2. Update Vercel environment variables:
   ```bash
   npx vercel env add DOKU_SECRET_KEY production
   ```
3. Trigger immediate redeployment to propagate new environment keys.
4. Run `npm test` and `scripts/test-doku.mjs` to verify HMAC signatures match.

---

## 3. Incident Postmortem Template
Following any SEV-1 or SEV-2 incident, record:
1. Summary: Brief description of what happened.
2. Timeline (WIB): Time detected, time mitigated, time resolved.
3. Root Cause: Why did the failure occur?
4. Action Items: Preventative measures implemented to prevent recurrence.
