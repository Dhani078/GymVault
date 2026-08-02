CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang (authenticated) bisa membaca kode untuk memverifikasi apakah valid/sudah dipakai
CREATE POLICY "Anyone can read promo codes" 
ON promo_codes FOR SELECT 
TO authenticated 
USING (true);

-- Policy: User yang sedang login bisa meng-update status kode menjadi 'used' (sekali pakai)
CREATE POLICY "Users can redeem code" 
ON promo_codes FOR UPDATE 
TO authenticated 
USING (is_used = false)
WITH CHECK (is_used = true AND used_by = auth.uid());

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
