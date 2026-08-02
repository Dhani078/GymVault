-- ============================================
-- FIX: Add missing DELETE RLS policies
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DELETE policy for workout_sessions (MISSING - this is why delete fails silently)
CREATE POLICY "sessions_delete" ON workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 2. DELETE policy for workout_sets (MISSING - must delete sets before sessions)
CREATE POLICY "sets_delete" ON workout_sets
  FOR DELETE USING (
    session_id IN (
      SELECT id FROM workout_sessions WHERE user_id = auth.uid()
    )
  );

-- 3. UPDATE policy for workout_sets (optional, for completeness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_sets' AND policyname = 'sets_update'
  ) THEN
    CREATE POLICY "sets_update" ON workout_sets
      FOR UPDATE USING (
        session_id IN (
          SELECT id FROM workout_sessions WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;
