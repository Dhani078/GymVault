-- ====================================================================
-- GYMVAULT TELEGRAM 1-CLICK PAYMENT VERIFICATION SYSTEM
-- ====================================================================
-- Run this in Supabase SQL Editor
-- ====================================================================

-- 1. Create Payment Requests Table
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  plan TEXT NOT NULL, -- 'monthly' | 'yearly'
  amount NUMERIC NOT NULL,
  proof_image_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own payment requests
DROP POLICY IF EXISTS "Users can view own payment requests" ON public.payment_requests;
CREATE POLICY "Users can view own payment requests" 
ON public.payment_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own payment requests
DROP POLICY IF EXISTS "Users can insert own payment requests" ON public.payment_requests;
CREATE POLICY "Users can insert own payment requests" 
ON public.payment_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);


-- 2. Secure RPC to Approve Payment from Telegram Webhook
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

  -- Update payment request
  UPDATE payment_requests
  SET status = 'approved',
      reviewed_at = NOW()
  WHERE id = request_id;

  -- Activate User Premium
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


-- 3. Secure RPC to Reject Payment from Telegram Webhook
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

  RETURN jsonb_build_object('success', true, 'message', 'Payment rejected.');
END;
$$;
