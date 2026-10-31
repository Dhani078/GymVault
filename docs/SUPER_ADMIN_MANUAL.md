# GymVault Super-Admin Dashboard & Platform Operations Manual

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Overview & Security Entitlement

The GymVault Super-Admin Dashboard is a restricted control center built into the web application (screens/AdminDashboard.js) and backed by hooks/useAdminData.js. It allows the platform maintainer to oversee user accounts, process payment requests, audit security events, and manage subscription promo codes.

### Access Control Rules
Access is restricted by two layers:
1. Application Layer: Evaluates profile.role === 'admin' or authenticated session email === 'dhanisepeda@gmail.com'. Unauthorized users are redirected to the guest view.
2. Database Layer: Row Level Security (RLS) on admin_logs and admin RPC functions enforces EXISTS (SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin').

---

## 2. Dashboard Workspace Structure

The Admin Dashboard provides 8 modular tabs:

### 2.1. Overview & Telemetry (AdminStats)
Displays high-level platform health metrics:
- Total Registered Users
- Total Active Pro Lifters
- Monthly Recurring Revenue (MRR)
- Total Completed Workout Sessions
- Total Weight Volume Lifted Across Platform (kg)

### 2.2. Athlete Management (UsersTable)
Provides comprehensive account inspection:
- Search by email, name, or username.
- Filter by status (Free, Pro Monthly, Pro Yearly, Suspended).
- Quick Actions:
  - Grant Pro Subscription (Custom duration: 7 days, 30 days, 365 days).
  - Revoke Pro Access.
  - Delete User Account (Executes cascading deletion of profile, sessions, and sets).
  - Every modification logs an immutable record to admin_logs.

### 2.3. QRIS Payment Requests (PaymentRequestsTable)
Centralized review station for incoming payment proofs:
- View invoice ID, payer name, requested plan, amount, and timestamp.
- Preview attached transfer proof screenshot.
- Action [ ACC ]: Triggers atomic database RPC approve_payment_request, immediately provisioning Pro entitlements.
- Action [ TOLAK ]: Marks request rejected and sends push notification to athlete.

### 2.4. System Health & Infrastructure (SystemHealthWidget)
Real-time diagnostic monitor:
- Supabase PostgreSQL REST connection latency.
- DOKU Payment Gateway API ping.
- Offline sync queue backlog count.
- Memory usage and client error counts.

### 2.5. Promo Code Management (PromoManager)
Generate and distribute promotional codes for marketing campaigns:
- Create code with custom duration (e.g. GYMVAULT2026).
- Set maximum usage limits and expiration dates.
- Audit which user redeemed each code and when.

### 2.6. Security Audit Trail (AuditLogs)
Displays chronological security and administrative logs:
- Columns: Timestamp (WIB), Admin ID, Action Code, Target User ID, Details.
- Monitored Actions: USER_DELETED, ROLE_PROMOTED, SUBSCRIPTION_GRANTED, PAYMENT_APPROVED, PAYMENT_REJECTED.
- Table backed by B-Tree index idx_admin_logs_created for fast retrieval.

---

## 3. Emergency Administrative Override

If the web dashboard is unreachable due to local network issues:
1. Use the Telegram Admin Bot (/grant, /revoke, /check commands).
2. Or connect directly via Supabase SQL Editor and invoke the administrative RPC:
   ```sql
   SELECT approve_payment_request('PAYMENT_REQUEST_UUID');
   ```
