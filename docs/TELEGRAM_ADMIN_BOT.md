# GymVault Super-Admin Telegram Bot & SaaS Command Center

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Overview

GymVault includes an automated administrative control center operated through Telegram Bot API. The system allows the SaaS owner (Dhani078) to monitor real-time subscription revenue, audit platform growth, inspect athlete profiles, and approve or reject QRIS payment receipts directly from Telegram with zero latency.

Webhook Endpoint: /api/telegram-webhook  
Local Daemon Alternative: scripts/start-telegram-bot.js  

---

## 2. Command Architecture & Syntax

All commands require the sender chat ID to match TELEGRAM_ADMIN_CHAT_ID. Unauthorized messages are dropped with zero response.

### Analytical Commands

1. /stats
- Purpose: Instant snapshot of SaaS platform metrics.
- Output: Total registered athletes, total Pro lifters, active 24h workouts, total volume lifted (kg), and pending payment approvals.

2. /growth
- Purpose: 7-day and 30-day user acquisition telemetry.
- Output: New signups, conversion rate from Free to Pro, and daily active user (DAU) trends.

3. /recent
- Purpose: Displays the last 5 completed workout sessions across all athletes.
- Output: Athlete name, exercise count, total volume (kg), and elapsed duration.

### User & Subscription Management Commands

4. /check <email>
- Syntax: /check athlete@example.com
- Purpose: Deep inspection of a specific athlete account.
- Output: User ID, registration date, subscription status (Free/Pro), expiration date, total workouts logged, and current check-in streak.

5. /grant <email> <days>
- Syntax: /grant athlete@example.com 30
- Purpose: Emergency manual subscription activation or customer support resolution.
- Behavior: Calls Supabase database to set is_premium = true, premium_plan = 'monthly' or 'yearly', and updates premium_until = NOW() + INTERVAL 'X days'. Logs action to admin_logs.

6. /revoke <email>
- Syntax: /revoke athlete@example.com
- Purpose: Immediately downgrades an account to Free tier upon chargeback or policy violation.

7. /broadcast <message>
- Syntax: /broadcast Waktunya latihan sore! Fitur baru kalkulator barbell sudah aktif.
- Purpose: Sends push notification / announcement broadcast to all opted-in athletes.

8. /clearnotif
- Purpose: Clears badge counters and resets unread payment alerts.

---

## 3. Instant Inline QRIS Approval Flow

When an athlete makes a QRIS transfer via manual proof upload:
1. System sends an instant formatted alert to Telegram:
   - Pengirim: Nama Atlet
   - Nominal: Rp 29.900 (Monthly Pro)
   - Invoice: GYM-1730000000-A1B2C3
   - Bukti Transfer: URL gambar bukti transfer
2. Telegram message includes inline buttons:
   - [ ACC ] -> Callback data: approve_PAYMENT_REQUEST_ID
   - [ TOLAK ] -> Callback data: reject_PAYMENT_REQUEST_ID
3. Tapping [ ACC ] triggers the atomic database RPC approve_payment_request:
   - Updates payment_requests status to approved.
   - Sets users_profile.is_premium = true.
   - Computes expiration timestamp based on selected plan.
   - Records administrative audit trail in admin_logs.
   - Updates Telegram message caption to [ TERVERIFIKASI ].

---

## 4. Webhook Security & Secret Token Enforcement

To prevent spoofing of Telegram callbacks:
- Every incoming POST request to /api/telegram-webhook must provide the header:
  X-Telegram-Bot-Api-Secret-Token: [TELEGRAM_SECRET_TOKEN]
- If header is missing or does not match process.env.TELEGRAM_SECRET_TOKEN, the endpoint terminates with HTTP 401 Unauthorized.
