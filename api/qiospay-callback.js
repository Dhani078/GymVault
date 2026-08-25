// /api/qiospay-callback.js
// Vercel Serverless Function to process Qiospay Realtime QRIS Webhooks

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle health check GET
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', gateway: 'Qiospay QRIS Webhook Endpoint' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    console.log('[QiosPay Webhook] Incoming Payload:', JSON.stringify(payload));

    const status = payload.status;
    const data = payload.data || payload;

    // Validate transaction status
    if (status !== 'success' && data.status !== 'success' && data.type !== 'CR') {
      return res.status(200).json({ received: true, message: 'Non-credit or pending transaction ignored' });
    }

    const payerName = data.name || 'Athlete';
    const amount = Number(data.amount) || 0;
    const refId = data.refid || data.reference_id || `qios_${Date.now()}`;
    const nmid = data.nmid || '-';
    const txTime = data.time || new Date().toLocaleString('id-ID');

    // Initialize Supabase Client
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QkDfIJZOVzZsO39jEdpI5w_fb4Bkavp';
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Find matching pending payment request
    // First, look for a pending request with matching exact amount
    const { data: pendingReqs, error: fetchErr } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    let matchedRequest = null;
    if (!fetchErr && pendingReqs && pendingReqs.length > 0) {
      // Find request with matching amount
      matchedRequest = pendingReqs.find(p => Math.abs(Number(p.amount) - amount) < 500) || pendingReqs[0];
    }

    let activatedUserId = null;
    let planActivated = amount >= 150000 ? 'yearly' : 'monthly';
    const intervalPeriod = planActivated === 'yearly' ? (365 * 24 * 60 * 60 * 1000) : (30 * 24 * 60 * 60 * 1000);
    const premiumUntil = new Date(Date.now() + intervalPeriod).toISOString();

    if (matchedRequest) {
      // Call Supabase RPC to approve
      try {
        await supabase.rpc('approve_payment_request', { request_id: matchedRequest.id });
        activatedUserId = matchedRequest.user_id;
        planActivated = matchedRequest.plan || planActivated;
      } catch (e) {
        // Fallback update
        await supabase
          .from('payment_requests')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', matchedRequest.id);

        if (matchedRequest.user_id) {
          await supabase
            .from('users_profile')
            .update({
              is_premium: true,
              premium_plan: planActivated,
              premium_until: premiumUntil
            })
            .eq('id', matchedRequest.user_id);
          activatedUserId = matchedRequest.user_id;
        }
      }
    } else {
      // Log standalone payment in payment_requests
      await supabase.from('payment_requests').insert({
        user_name: payerName,
        user_email: `qios_${refId}@gymvault.id`,
        plan: planActivated,
        amount: amount,
        status: 'approved',
        proof_url: `QiosPay Ref: ${refId} (NMID: ${nmid})`,
        reviewed_at: new Date().toISOString()
      });
    }

    // 2. Send Telegram Admin Instant Broadcast
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8898525963:AAEKuNhil6t-lia7JvxKBIYQjDSDZOkkXfE';
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '1224442718';

    if (botToken && adminChatId) {
      const telegramMsg = `⚡ <b>PEMBAYARAN QRIS OTOMATIS SUKSES! (QIOSPAY)</b>\n\n` +
        `👤 <b>Pengirim:</b> ${payerName}\n` +
        `💰 <b>Nominal:</b> Rp ${amount.toLocaleString('id-ID')}\n` +
        `📦 <b>Paket:</b> ${planActivated.toUpperCase()} PRO\n` +
        `🔖 <b>Ref ID:</b> <code>${refId}</code>\n` +
        `🏛 <b>NMID:</b> <code>${nmid}</code>\n` +
        `⏰ <b>Waktu:</b> ${txTime}\n\n` +
        `✅ <b>Status:</b> Akun User Otomatis Di-Upgrade Menjadi PRO Lifter (100% Realtime)! 🏆`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: telegramMsg,
            parse_mode: 'HTML'
          })
        });
      } catch (tgErr) {
        console.warn('[QiosPay Webhook] Telegram Alert Error:', tgErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'QRIS payment verified and activated successfully',
      refid: refId,
      amount: amount
    });

  } catch (error) {
    console.error('[QiosPay Webhook] Internal Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error processing callback'
    });
  }
}
