CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa melihat kode promo yang pernah ia gunakan sendiri (mencegah pencurian massal kode promo)
CREATE POLICY "Users can view only their redeemed codes" 
ON promo_codes FOR SELECT 
TO authenticated 
USING (used_by = auth.uid());

-- Secure RPC Function to Redeem Promo Codes safely
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

-- Insert 15 Kode Premium Acak (Setiap user akan diberikan 1 kode unik oleh Admin)
INSERT INTO promo_codes (code) VALUES 
('GV-A8F2'),
('GV-X9Q1'),
('GV-B4N7'),
('GV-P3L5'),
('GV-W6J8'),
('GV-T2M9'),
('GV-K5H4'),
('GV-R1Y6'),
('GV-D7C3'),
('GV-E9V2'),
('GV-F4U8'),
('GV-S2G6'),
('GV-Z7X4'),
('GV-L3K1'),
('GV-M5P9')
ON CONFLICT (code) DO NOTHING;
