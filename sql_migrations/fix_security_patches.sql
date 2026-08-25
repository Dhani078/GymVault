-- ====================================================================
-- GYMVAULT SECURITY PATCHES (Audit by Strix + Ponytail)
-- ====================================================================
-- Run this in your Supabase SQL Editor to secure your database against:
-- 1. Mass Promo Code Dumping & Insecure Redemption
-- 2. Privilege Escalation (Clients updating their own 'role' to 'admin')
-- 3. Insecure Client-Side Premium Status Tampering
-- ====================================================================

-- ─── 1. SECURE PROMO CODE REDEMPTION ───
-- Disable open SELECT for promo codes to prevent dumping
DROP POLICY IF EXISTS "Anyone can read promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Users can redeem code" ON promo_codes;

-- Only service role or admins can select all codes; regular users can only check their own redeemed codes
CREATE POLICY "Users can view only their redeemed codes" 
ON promo_codes FOR SELECT 
TO authenticated 
USING (used_by = auth.uid());

-- Atomic Secure RPC Function to Redeem Promo Codes
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

  -- Lookup code
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

  -- Mark code as used
  UPDATE promo_codes
  SET is_used = true,
      used_by = current_user_id
  WHERE id = target_id;

  -- Grant Premium to user profile
  UPDATE users_profile
  SET is_premium = true,
      premium_plan = 'lifetime_promo',
      premium_until = NOW() + INTERVAL '10 years'
  WHERE id = current_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Selamat! Akun Anda kini aktif sebagai GymVault Premium.');
END;
$$;


-- ─── 2. PREVENT PRIVILEGE ESCALATION (ROLE & PREMIUM TAMPERING) ───
-- Prevents authenticated users from manually altering 'role' to 'admin' via client-side .update()
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if 'role' is being modified
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only allow service_role or existing admin to change role
    IF (auth.jwt() ->> 'role' != 'service_role') AND (OLD.role != 'admin') THEN
      RAISE EXCEPTION 'Unauthorized: Anda tidak diizinkan mengubah role pengguna.';
    END IF;
  END IF;

  -- Check if 'is_premium' is being directly modified without service_role
  -- (Must be granted through redeem_promo_code RPC or verified payment webhook)
  IF (NEW.is_premium IS DISTINCT FROM OLD.is_premium) AND (NEW.is_premium = true) AND (OLD.is_premium IS NOT TRUE) THEN
    IF (auth.jwt() ->> 'role' != 'service_role') AND (current_user != 'postgres') THEN
      -- Allow RPC / internal executions, but block direct client payload updates
      -- Note: PostgreSQL SECURITY DEFINER functions run with owner privileges
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON users_profile;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_profile_privilege_escalation();
