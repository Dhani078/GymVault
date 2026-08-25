-- 1. Create a secure RPC to allow logging in with Username
CREATE OR REPLACE FUNCTION get_email_by_username(lookup_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_email text;
BEGIN
  SELECT email INTO found_email
  FROM users_profile
  WHERE username = lookup_username
  LIMIT 1;
  
  RETURN found_email;
END;
$$;

-- 2. Create the Nutrition Logs Table for Meal History
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fats numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on Nutrition Logs
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Nutrition Logs (Users can only see and insert their own data)
DROP POLICY IF EXISTS "Users can read own nutrition logs" ON nutrition_logs;
CREATE POLICY "Users can read own nutrition logs"
ON nutrition_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own nutrition logs" ON nutrition_logs;
CREATE POLICY "Users can insert own nutrition logs"
ON nutrition_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own nutrition logs" ON nutrition_logs;
CREATE POLICY "Users can delete own nutrition logs"
ON nutrition_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Body Weight Logs Table
CREATE TABLE IF NOT EXISTS public.body_weight_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own weight logs" ON public.body_weight_logs;
CREATE POLICY "Users can read own weight logs"
ON public.body_weight_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own weight logs" ON public.body_weight_logs;
CREATE POLICY "Users can insert own weight logs"
ON public.body_weight_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own weight logs" ON public.body_weight_logs;
CREATE POLICY "Users can delete own weight logs"
ON public.body_weight_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Add custom_routines column to users_profile
ALTER TABLE public.users_profile ADD COLUMN IF NOT EXISTS custom_routines JSONB DEFAULT '[]'::jsonb;

-- 7. Global Leaderboard RPC (Security Definer to bypass RLS for ranking aggregated stats)
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

-- 8. Athlete Search RPC (Security Definer to bypass RLS securely)
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


