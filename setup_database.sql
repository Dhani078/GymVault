-- =============================================
-- GymVault Database Setup
-- =============================================
-- INSTRUCTIONS: 
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project (sjrzhiigrcrcpgvnfixo)
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Paste this ENTIRE file and click "Run"
-- =============================================

-- 1. Users Profile
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE,
    email TEXT,
    body_weight REAL,
    height REAL,
    cns_fatigue INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS body_weight REAL;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS height REAL;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS custom_routines JSONB DEFAULT '[]'::jsonb;

-- 2. Exercises Reference
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE,
    muscle_group TEXT,
    equipment_type TEXT,
    thumbnail_url TEXT
);

-- 3. Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    split_name TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT FALSE
);

-- 4. Workout Sets
CREATE TABLE IF NOT EXISTS workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    set_index INT,
    weight_kg REAL,
    reps INT,
    is_checked BOOLEAN DEFAULT FALSE
);

-- Auth Trigger: auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, name, username, email, created_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.email,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (to avoid conflicts)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile." ON users_profile;
  DROP POLICY IF EXISTS "Users can update their own profile." ON users_profile;
  DROP POLICY IF EXISTS "Service role can insert profiles." ON users_profile;
  DROP POLICY IF EXISTS "Service can insert profiles" ON users_profile;
  DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
  DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
  DROP POLICY IF EXISTS "Users can view their own sessions." ON workout_sessions;
  DROP POLICY IF EXISTS "Users can insert their own sessions." ON workout_sessions;
  DROP POLICY IF EXISTS "Users can update their own sessions." ON workout_sessions;
  DROP POLICY IF EXISTS "Users can view own sessions" ON workout_sessions;
  DROP POLICY IF EXISTS "Users can insert own sessions" ON workout_sessions;
  DROP POLICY IF EXISTS "Users can update own sessions" ON workout_sessions;
  DROP POLICY IF EXISTS "Users can view own sets" ON workout_sets;
  DROP POLICY IF EXISTS "Users can insert own sets" ON workout_sets;
  DROP POLICY IF EXISTS "Exercises are public read." ON exercises;
  DROP POLICY IF EXISTS "Exercises are public" ON exercises;
END $$;

-- users_profile policies
CREATE POLICY "profile_select" ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_insert" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profile_update" ON users_profile FOR UPDATE USING (auth.uid() = id);

-- workout_sessions policies
CREATE POLICY "sessions_select" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- workout_sets policies (users can manage sets in their own sessions)
CREATE POLICY "sets_select" ON workout_sets FOR SELECT USING (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "sets_insert" ON workout_sets FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "sets_delete" ON workout_sets FOR DELETE USING (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);

-- exercises are public
CREATE POLICY "exercises_public" ON exercises FOR SELECT USING (true);

-- Seed sample exercises
INSERT INTO exercises (name, muscle_group, equipment_type) VALUES
('Barbell Bench Press', 'Chest', 'Barbell'),
('Pull-Ups', 'Back', 'Bodyweight'),
('Romanian Deadlift', 'Hamstrings', 'Barbell'),
('Leg Press', 'Quads', 'Machine'),
('Overhead Press', 'Shoulders', 'Barbell'),
('Squat', 'Quads', 'Barbell'),
('Deadlift', 'Back', 'Barbell')
ON CONFLICT (name) DO NOTHING;

-- Backfill: create profile for existing auth users who don't have one
INSERT INTO users_profile (id, name, email)
SELECT id, raw_user_meta_data->>'full_name', email 
FROM auth.users 
WHERE id NOT IN (SELECT id FROM users_profile)
ON CONFLICT (id) DO NOTHING;

-- Global Leaderboard RPC (Security Definer to bypass RLS for ranking aggregated stats)
DROP FUNCTION IF EXISTS get_global_leaderboard();
CREATE OR REPLACE FUNCTION get_global_leaderboard()
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  total_volume NUMERIC,
  workout_count BIGINT,
  streak INT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_workout_days AS (
    SELECT DISTINCT
      ws.user_id,
      (ws.started_at AT TIME ZONE 'UTC')::date AS workout_date
    FROM
      workout_sessions ws
    WHERE
      ws.is_completed = true
  ),
  user_streaks AS (
    SELECT
      uwd.user_id,
      uwd.workout_date,
      uwd.workout_date - (ROW_NUMBER() OVER (PARTITION BY uwd.user_id ORDER BY uwd.workout_date))::int AS grp
    FROM
      user_workout_days uwd
  ),
  streak_lengths AS (
    SELECT
      us.user_id,
      COUNT(*) AS streak_len,
      MAX(us.workout_date) AS last_workout_date
    FROM
      user_streaks us
    GROUP BY
      us.user_id, us.grp
  ),
  current_streaks AS (
    SELECT
      sl.user_id,
      sl.streak_len AS streak
    FROM
      streak_lengths sl
    WHERE
      sl.last_workout_date >= CURRENT_DATE - INTERVAL '1 day'
  )
  SELECT 
    up.id AS user_id,
    COALESCE(up.name, 'Athlete') AS name,
    COALESCE(up.username, 'athlete') AS username,
    up.avatar_url,
    COALESCE(SUM(ws_sets.volume), 0)::NUMERIC AS total_volume,
    COUNT(DISTINCT ws.id) AS workout_count,
    COALESCE(cs.streak, 0)::INT AS streak
  FROM 
    users_profile up
  LEFT JOIN 
    workout_sessions ws ON ws.user_id = up.id AND ws.is_completed = true
  LEFT JOIN (
    SELECT 
      session_id,
      SUM(COALESCE(weight_kg, 0) * COALESCE(reps, 0)) AS volume
    FROM 
      workout_sets
    WHERE 
      is_checked = true
    GROUP BY 
      session_id
  ) ws_sets ON ws_sets.session_id = ws.id
  LEFT JOIN
    current_streaks cs ON cs.user_id = up.id
  GROUP BY 
    up.id, up.name, up.username, up.avatar_url, cs.streak
  ORDER BY 
    total_volume DESC
  LIMIT 50;
END;
$$;

ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Athlete Search RPC (Security Definer to bypass RLS securely)
DROP FUNCTION IF EXISTS search_users(TEXT);
CREATE OR REPLACE FUNCTION search_users(search_query TEXT)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  total_volume NUMERIC,
  streak INT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_workout_days AS (
    SELECT DISTINCT
      ws.user_id,
      (ws.started_at AT TIME ZONE 'UTC')::date AS workout_date
    FROM
      workout_sessions ws
    WHERE
      ws.is_completed = true
  ),
  user_streaks AS (
    SELECT
      uwd.user_id,
      uwd.workout_date,
      uwd.workout_date - (ROW_NUMBER() OVER (PARTITION BY uwd.user_id ORDER BY uwd.workout_date))::int AS grp
    FROM
      user_workout_days uwd
  ),
  streak_lengths AS (
    SELECT
      us.user_id,
      COUNT(*) AS streak_len,
      MAX(us.workout_date) AS last_workout_date
    FROM
      user_streaks us
    GROUP BY
      us.user_id, us.grp
  ),
  current_streaks AS (
    SELECT
      sl.user_id,
      sl.streak_len AS streak
    FROM
      streak_lengths sl
    WHERE
      sl.last_workout_date >= CURRENT_DATE - INTERVAL '1 day'
  )
  SELECT 
    up.id AS user_id,
    COALESCE(up.name, 'Athlete') AS name,
    COALESCE(up.username, 'athlete') AS username,
    up.avatar_url,
    COALESCE(SUM(ws_sets.volume), 0)::NUMERIC AS total_volume,
    COALESCE(cs.streak, 0)::INT AS streak
  FROM 
    users_profile up
  LEFT JOIN 
    workout_sessions ws ON ws.user_id = up.id AND ws.is_completed = true
  LEFT JOIN (
    SELECT 
      session_id,
      SUM(COALESCE(weight_kg, 0) * COALESCE(reps, 0)) AS volume
    FROM 
      workout_sets
    WHERE 
      is_checked = true
    GROUP BY 
      session_id
  ) ws_sets ON ws_sets.session_id = ws.id
  LEFT JOIN
    current_streaks cs ON cs.user_id = up.id
  WHERE
    up.username ILIKE '%' || search_query || '%'
    OR up.name ILIKE '%' || search_query || '%'
  GROUP BY 
    up.id, up.name, up.username, up.avatar_url, cs.streak
  ORDER BY 
    total_volume DESC
  LIMIT 20;
END;
$$;


-- ====================================================================
-- 7. PAYMENT REQUESTS TABLE (QRIS DANA 1-CLICK SYSTEM)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  plan TEXT NOT NULL, -- 'monthly' | 'yearly'
  amount NUMERIC NOT NULL,
  proof_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view own payment requests" 
ON public.payment_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment requests" ON public.payment_requests;
CREATE POLICY "Users can insert own payment requests" 
ON public.payment_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Secure RPC to Approve Payment from Telegram Webhook
CREATE OR REPLACE FUNCTION public.approve_payment_request(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record RECORD;
  interval_period INTERVAL;
BEGIN
  SELECT * INTO req_record
  FROM payment_requests
  WHERE id = request_id
  LIMIT 1;

  IF req_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Payment request not found.');
  END IF;

  IF req_record.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already approved.');
  END IF;

  IF req_record.plan = 'yearly' THEN
    interval_period := INTERVAL '1 year';
  ELSE
    interval_period := INTERVAL '1 month';
  END IF;

  UPDATE payment_requests
  SET status = 'approved',
      reviewed_at = NOW()
  WHERE id = request_id;

  UPDATE users_profile
  SET is_premium = true,
      premium_plan = req_record.plan,
      premium_until = NOW() + interval_period
  WHERE id = req_record.user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Payment approved and user premium activated!',
    'user_id', req_record.user_id,
    'user_name', req_record.user_name,
    'plan', req_record.plan
  );
END;
$$;

-- Secure RPC to Reject Payment from Telegram Webhook
CREATE OR REPLACE FUNCTION public.reject_payment_request(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_record RECORD;
BEGIN
  SELECT * INTO req_record
  FROM payment_requests
  WHERE id = request_id
  LIMIT 1;

  IF req_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Payment request not found.');
  END IF;

  UPDATE payment_requests
  SET status = 'rejected',
      reviewed_at = NOW()
  WHERE id = request_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Payment request rejected.',
    'user_id', req_record.user_id
  );
END;
$$;


-- ====================================================================
-- 8. PROMO CODES TABLE & ATOMIC REDEEM RPC
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view only their redeemed codes" ON public.promo_codes;
CREATE POLICY "Users can view only their redeemed codes" 
ON public.promo_codes FOR SELECT 
TO authenticated 
USING (used_by = auth.uid());

CREATE OR REPLACE FUNCTION public.redeem_promo_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id UUID;
  already_used BOOLEAN;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Authentication required.');
  END IF;

  SELECT id, is_used INTO target_id, already_used
  FROM promo_codes
  WHERE code = UPPER(TRIM(input_code))
  LIMIT 1;

  IF target_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode promo tidak valid.');
  END IF;

  IF already_used THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kode promo sudah pernah digunakan.');
  END IF;

  UPDATE promo_codes
  SET is_used = true,
      used_by = current_user_id
  WHERE id = target_id;

  UPDATE users_profile
  SET is_premium = true,
      premium_plan = 'lifetime_promo',
      premium_until = NOW() + INTERVAL '10 years'
  WHERE id = current_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Selamat! Akun Anda kini aktif sebagai GymVault Premium.');
END;
$$;

