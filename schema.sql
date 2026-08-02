-- GymVault Database Schema

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

-- If table already exists, add columns safely:
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS custom_routines JSONB DEFAULT '[]'::jsonb;

-- Auth Trigger for new users (stores name + username + email)
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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Allow insert on users_profile for the auth trigger
CREATE POLICY "Service role can insert profiles." ON users_profile FOR INSERT WITH CHECK (true);

-- Public function to look up email by username (queries users_profile, not auth.users)
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username TEXT)
RETURNS TEXT AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email INTO found_email FROM public.users_profile
  WHERE username = lookup_username
  LIMIT 1;
  RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE,
    muscle_group TEXT,
    equipment_type TEXT,
    thumbnail_url TEXT
);

CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    split_name TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id),
    set_index INT,
    weight_kg REAL,
    reps INT,
    is_checked BOOLEAN DEFAULT FALSE
);

-- Pre-populate standard reference records
INSERT INTO exercises (name, muscle_group, equipment_type) VALUES
('Barbell Bench Press', 'Chest', 'Barbell'),
('Pull-Ups', 'Back', 'Bodyweight'),
('Romanian Deadlift', 'Hamstrings', 'Barbell'),
('Leg Press', 'Quads', 'Machine'),
('Overhead Press', 'Shoulders', 'Barbell')
ON CONFLICT (name) DO NOTHING;

-- RLS Policies
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON users_profile FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own sessions." ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions." ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions." ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions." ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sets." ON workout_sets FOR SELECT USING (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own sets." ON workout_sets FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own sets." ON workout_sets FOR UPDATE USING (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own sets." ON workout_sets FOR DELETE USING (
  session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid())
);

-- Exercises are public read
CREATE POLICY "Exercises are public read." ON exercises FOR SELECT USING (true);
