# GymVault Database Schema & Security Architecture

> Comprehensive specification for PostgreSQL schema, Row Level Security (RLS) policies, triggers, and RPC procedures on Supabase.  
> Author: Dhani078  
> Version: 2.4.0  
> Status: Production Ready

---

## 1. Relational Entity Diagram

```text
┌─────────────────────────┐
│       auth.users        │
└────────────┬────────────┘
             │ 1:1 (ON DELETE CASCADE)
             ▼
┌─────────────────────────┐       1:N        ┌─────────────────────────┐
│      users_profile      ├─────────────────►│     workout_sessions    │
└────────────┬────────────┘                  └────────────┬────────────┘
             │                                            │
             │ 1:N                                        │ 1:N (ON DELETE CASCADE)
             ▼                                            ▼
┌─────────────────────────┐                  ┌─────────────────────────┐
│     nutrition_logs      │                  │      workout_sets       │
└─────────────────────────┘                  └────────────┬────────────┘
             │                                            │
             │ 1:N                                        │ N:1
             ▼                                            ▼
┌─────────────────────────┐                  ┌─────────────────────────┐
│    payment_requests     │                  │        exercises        │
└─────────────────────────┘                  └─────────────────────────┘
```

---

## 2. Table Specifications

### 2.1. `public.users_profile`
Stores athlete profile metadata, bio-metrics, role entitlements, and subscription status.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Unique user identifier matching Supabase Auth. |
| `name` | `TEXT` | `NOT NULL` | Athlete display name. |
| `username` | `TEXT` | `UNIQUE NOT NULL` | Unique public handle (lowercase alphanumeric). |
| `email` | `TEXT` | `NOT NULL` | Registered email address. |
| `body_weight` | `NUMERIC(5,2)` | `DEFAULT 0.0` | Athlete current weight in kilograms. |
| `height` | `NUMERIC(5,2)` | `DEFAULT 0.0` | Athlete height in centimeters. |
| `cns_fatigue` | `INTEGER` | `DEFAULT 0 CHECK (cns_fatigue BETWEEN 0 AND 100)` | Real-time Central Nervous System fatigue score. |
| `custom_routines` | `JSONB` | `DEFAULT '[]'::jsonb` | User-defined custom workout splits and exercises. |
| `role` | `TEXT` | `DEFAULT 'user' CHECK (role IN ('user', 'admin'))` | Security role determining access levels. |
| `is_premium` | `BOOLEAN` | `DEFAULT FALSE` | Active Pro subscription flag. |
| `premium_plan` | `TEXT` | `CHECK (premium_plan IN ('monthly', 'yearly', 'lifetime', NULL))` | Subscribed tier identifier. |
| `premium_until` | `TIMESTAMPTZ`| `NULL` | Subscription expiration timestamp. |
| `avatar_url` | `TEXT` | `NULL` | Public CDN URL for profile avatar image. |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Record creation timestamp. |

---

### 2.2. `public.exercises`
Reference catalog of standard physical exercises, muscle engagement maps, and equipment requirements.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique exercise identifier. |
| `name` | `TEXT` | `UNIQUE NOT NULL` | Exercise canonical name (e.g., "Barbell Bench Press"). |
| `muscle_group` | `TEXT` | `NOT NULL` | Primary target muscle (e.g., "chest", "lats", "quads"). |
| `equipment_type` | `TEXT` | `NOT NULL` | Required equipment (e.g., "barbell", "dumbbell", "machine", "bodyweight"). |
| `thumbnail_url` | `TEXT` | `NULL` | Asset illustration or demonstration animation URL. |

---

### 2.3. `public.workout_sessions`
Represents an individual physical training session performed by an athlete.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique workout session identifier. |
| `user_id` | `UUID` | `NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE` | Athlete owner identifier. |
| `split_name` | `TEXT` | `NOT NULL` | Training split category (e.g., "Push Day A", "Upper Power"). |
| `started_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Session start timestamp. |
| `is_completed` | `BOOLEAN` | `DEFAULT FALSE` | Flag indicating finalized session. |

---

### 2.4. `public.workout_sets`
Granular set execution data recorded within an active workout session.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique set log identifier. |
| `session_id` | `UUID` | `NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE` | Parent workout session identifier. |
| `exercise_id` | `UUID` | `NULL REFERENCES exercises(id) ON DELETE SET NULL` | Reference exercise identifier. Nullable to prevent data loss. |
| `set_index` | `INTEGER` | `NOT NULL CHECK (set_index >= 0)` | Set sequence order within exercise. |
| `weight_kg` | `NUMERIC(6,2)` | `NOT NULL CHECK (weight_kg >= 0)` | Weight lifted in kilograms. |
| `reps` | `INTEGER` | `NOT NULL CHECK (reps >= 0)` | Repetitions completed. |
| `is_checked` | `BOOLEAN` | `DEFAULT TRUE` | Completion confirmation flag. |

---

### 2.5. `public.nutrition_logs`
Chronological meal and macronutrient tracking records.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique nutrition entry identifier. |
| `user_id` | `UUID` | `NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE` | Athlete owner identifier. |
| `meal_name` | `TEXT` | `NOT NULL` | Descriptive meal name (e.g., "Dada Ayam Panggang + Nasi"). |
| `calories` | `INTEGER` | `NOT NULL CHECK (calories >= 0)` | Total energy value in kilocalories. |
| `protein_g` | `NUMERIC(5,1)` | `DEFAULT 0.0 CHECK (protein_g >= 0)` | Protein content in grams. |
| `carbs_g` | `NUMERIC(5,1)` | `DEFAULT 0.0 CHECK (carbs_g >= 0)` | Carbohydrate content in grams. |
| `fat_g` | `NUMERIC(5,1)` | `DEFAULT 0.0 CHECK (fat_g >= 0)` | Lipid / fat content in grams. |
| `logged_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Meal consumption timestamp. |

---

### 2.6. `public.payment_requests`
Audit ledger for subscription transactions initiated via DOKU QRIS or manual bank transfer.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique transaction invoice identifier. |
| `user_id` | `UUID` | `NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE` | Requesting athlete identifier. |
| `user_name` | `TEXT` | `NOT NULL` | Athlete name at transaction time. |
| `user_email` | `TEXT` | `NOT NULL` | Athlete email for invoice delivery. |
| `plan` | `TEXT` | `NOT NULL CHECK (plan IN ('monthly', 'yearly'))` | Selected tier duration. |
| `amount` | `NUMERIC(10,2)`| `NOT NULL CHECK (amount > 0)` | Nominal invoice amount in IDR. |
| `status` | `TEXT` | `DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))` | Transaction settlement status. |
| `proof_url` | `TEXT` | `NULL` | Receipt image URL or DOKU invoice reference. |
| `reviewed_at` | `TIMESTAMPTZ`| `NULL` | Timestamp of settlement or admin review. |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Transaction creation timestamp. |

---

### 2.7. `public.promo_codes`
Discount and promotional voucher registry for marketing campaigns.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique voucher record identifier. |
| `code` | `TEXT` | `UNIQUE NOT NULL` | Uppercase alphanumeric voucher code. |
| `discount_percent`| `INTEGER` | `DEFAULT 100 CHECK (discount_percent BETWEEN 1 AND 100)` | Discount rate applied. |
| `duration_days` | `INTEGER` | `DEFAULT 30 CHECK (duration_days > 0)` | Granted Pro duration upon redemption. |
| `max_uses` | `INTEGER` | `DEFAULT 100` | Redemption cap. |
| `used_count` | `INTEGER` | `DEFAULT 0` | Current number of redemptions. |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Administrative enablement toggle. |
| `expires_at` | `TIMESTAMPTZ`| `NULL` | Voucher expiration timestamp. |
| `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Voucher creation timestamp. |

---

## 3. Row Level Security (RLS) Policies

Every table operates under strict fail-closed Row Level Security:

```sql
-- Enable RLS across all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- 1. users_profile Policies
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON users_profile FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (auth.uid() = id);

-- 2. exercises Policies (Public Catalog)
CREATE POLICY "Public read access for exercises"
  ON exercises FOR SELECT
  USING (true);

-- 3. workout_sessions Policies
CREATE POLICY "Users can read own workout sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions"
  ON workout_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 4. workout_sets Policies
CREATE POLICY "Users can read sets belonging to their sessions"
  ON workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = workout_sets.session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sets into their sessions"
  ON workout_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = workout_sets.session_id
        AND workout_sessions.user_id = auth.uid()
    )
  );

-- 5. payment_requests Policies
CREATE POLICY "Users can view their own payment requests"
  ON payment_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests"
  ON payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin has full access to payment requests"
  ON payment_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 4. Anti-Privilege Escalation Trigger

To guarantee that non-admin clients cannot modify their own `role` or `is_premium` columns via client-side mutations, a `BEFORE UPDATE` trigger enforces strict validation:

```sql
CREATE OR REPLACE FUNCTION prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent regular users from modifying role or is_premium directly
  IF (OLD.role != NEW.role OR OLD.is_premium != NEW.is_premium) THEN
    IF NOT EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      NEW.role := OLD.role;
      NEW.is_premium := OLD.is_premium;
      NEW.premium_until := OLD.premium_until;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_privilege_escalation();
```

---

## 5. Atomic RPC Procedures

### 5.1. `approve_payment_request`
Atomically marks a payment as approved and extends the user's Pro membership:

```sql
CREATE OR REPLACE FUNCTION approve_payment_request(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_req RECORD;
  v_duration INTERVAL;
  v_new_until TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_req FROM payment_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment request not found');
  END IF;

  IF v_req.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request already approved');
  END IF;

  IF v_req.plan = 'yearly' THEN
    v_duration := INTERVAL '1 year';
  ELSE
    v_duration := INTERVAL '30 days';
  END IF;

  v_new_until := GREATEST(NOW(), COALESCE((SELECT premium_until FROM users_profile WHERE id = v_req.user_id), NOW())) + v_duration;

  UPDATE users_profile
  SET is_premium = TRUE,
      premium_plan = v_req.plan,
      premium_until = v_new_until
  WHERE id = v_req.user_id;

  UPDATE payment_requests
  SET status = 'approved', reviewed_at = NOW()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'premium_until', v_new_until);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Performance Indexes

The following B-Tree indexes optimize high-volume queries:

```sql
-- Workout session lookups by user and date
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, started_at DESC);

-- Fast set queries by session
CREATE INDEX idx_workout_sets_session ON workout_sets(session_id, set_index ASC);

-- Nutrition chronological history
CREATE INDEX idx_nutrition_logs_user_date ON nutrition_logs(user_id, logged_at DESC);

-- Pending payment requests for admin dashboard
CREATE INDEX idx_payment_requests_pending ON payment_requests(status) WHERE status = 'pending';
```
