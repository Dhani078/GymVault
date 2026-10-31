import { createClient } from '@supabase/supabase-js';
import { createDokuCheckout } from '../services/dokuService.js';

// In-memory rate limiter per IP (prevents payment invoice flooding)
const rateLimitMap = new Map();
function isRateLimited(key, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return true;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(clientIp, 10, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  try {
    const { userId, plan = 'monthly', amount, userEmail, userName } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Server database configuration missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const targetAmount = Number(amount) || (plan === 'yearly' ? 199900 : 29900);
    const invoiceNumber = `GYM-${Date.now()}-${String(userId).replace(/-/g, '').slice(0, 6)}`;

    // 1. Catat pending payment request ke database
    const { data: requestRecord, error: insertErr } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        user_name: userName || 'Athlete',
        user_email: userEmail || `athlete_${userId.slice(0, 8)}@gymvault.id`,
        plan,
        amount: targetAmount,
        status: 'pending',
        proof_url: `DOKU Invoice: ${invoiceNumber}`,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertErr) {
      console.warn('[doku-checkout] Supabase insert warning:', insertErr.message);
    }

    // 2. Request link DOKU Checkout QRIS
    const dokuResult = await createDokuCheckout({
      orderId: invoiceNumber,
      amountIdr: targetAmount,
      callbackUrl: 'https://gymvault-app.vercel.app/api/doku-webhook',
      resultUrl: 'https://gymvault-app.vercel.app',
    });

    if (dokuResult.success && dokuResult.paymentUrl) {
      return res.status(200).json({
        success: true,
        paymentUrl: dokuResult.paymentUrl,
        invoiceNumber,
        requestId: requestRecord?.id || null,
        amount: targetAmount,
        plan
      });
    }

    // Jika DOKU sedang pending/maintenance, return status agar frontend fallback ke manual QRIS
    return res.status(200).json({
      success: false,
      fallbackManual: true,
      error: dokuResult.error || 'DOKU Checkout Gateway offline',
      invoiceNumber,
      amount: targetAmount,
      plan
    });

  } catch (error) {
    console.error('[doku-checkout] Handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
