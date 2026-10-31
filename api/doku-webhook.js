import { createClient } from '@supabase/supabase-js';
import { verifyDokuNotification } from '../services/dokuService.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', gateway: 'GymVault DOKU QRIS Webhook Endpoint' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const clientId = req.headers['client-id'] || '';
    const requestId = req.headers['request-id'] || '';
    const requestTimestamp = req.headers['request-timestamp'] || '';
    const signature = req.headers['signature'] || '';

    // Handle raw string or JSON body
    let rawBody = '';
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body || {});
    }

    // 1. 🛡️ Verifikasi HMAC-SHA256 signature DOKU (fail-closed)
    const isSignatureValid = verifyDokuNotification({
      clientId,
      requestId,
      requestTimestamp,
      signature,
      body: rawBody,
      targetPath: '/api/doku-webhook'
    });

    // Tolak jika signature salah saat credential DOKU terkonfigurasi
    if (process.env.DOKU_SECRET_KEY && !isSignatureValid) {
      console.warn('[doku-webhook] ❌ Invalid HMAC signature from IP:', req.headers['x-forwarded-for'] || req.socket?.remoteAddress);
      return res.status(403).json({ error: 'Forbidden: Invalid DOKU signature' });
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const orderId = payload.order?.invoice_number || payload.invoice_number;
    const transactionStatus = payload.transaction?.status || payload.status;
    const amountPaid = Number(payload.transaction?.amount || payload.order?.amount || payload.amount || 0);

    console.log(`[doku-webhook] Notification received: ${orderId} | Status: ${transactionStatus} | Rp ${amountPaid}`);

    if (!orderId) {
      return res.status(400).json({ error: 'Missing invoice_number in payload' });
    }

    // Jika status bukan SUCCESS atau PAID, respons 200 agar DOKU tidak retry terus menerus
    if (transactionStatus !== 'SUCCESS' && transactionStatus !== 'PAID') {
      return res.status(200).json({ received: true, message: `Ignored status: ${transactionStatus}` });
    }

    // 2. Hubungkan ke database Supabase
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('[doku-webhook] Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 3. Cari payment_requests berdasarkan nomor invoice
    const { data: matchedRequests, error: _fetchErr } = await supabase
      .from('payment_requests')
      .select('*')
      .ilike('proof_url', `%${orderId}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    const targetRequest = matchedRequests?.[0];

    let activatedUserId = null;
    let activatedPlan = 'monthly';

    if (targetRequest) {
      if (targetRequest.status === 'approved') {
        return res.status(200).json({ message: 'Already approved' });
      }

      activatedUserId = targetRequest.user_id;
      activatedPlan = targetRequest.plan || 'monthly';

      // Jalankan RPC atomic approval
      try {
        await supabase.rpc('approve_payment_request', { request_id: targetRequest.id });
      } catch (_rpcErr) {
        // Fallback update jika RPC gagal
        const intervalMs = activatedPlan === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
        const premiumUntil = new Date(Date.now() + intervalMs).toISOString();

        await supabase
          .from('payment_requests')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', targetRequest.id);

        if (activatedUserId) {
          await supabase
            .from('users_profile')
            .update({
              is_premium: true,
              premium_plan: activatedPlan,
              premium_until: premiumUntil
            })
            .eq('id', activatedUserId);
        }
      }
    } else {
      // Invoice tidak tercatat sebelumnya (pembayaran langsung di gateway)
      activatedPlan = amountPaid >= 150000 ? 'yearly' : 'monthly';
      await supabase.from('payment_requests').insert({
        user_name: payload.customer?.name || 'Athlete (DOKU QRIS)',
        user_email: payload.customer?.email || `doku_${orderId}@gymvault.id`,
        plan: activatedPlan,
        amount: amountPaid,
        status: 'approved',
        proof_url: `DOKU Invoice: ${orderId}`,
        reviewed_at: new Date().toISOString()
      });
    }

    // 4. Kirim notifikasi instant ke Telegram Admin Bot
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (botToken && adminChatId) {
      const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const telegramMsg =
        `⚡ <b>PEMBAYARAN DOKU QRIS RESMI SUKSES!</b> 🏛️\n\n` +
        `👤 <b>Lifter:</b> ${targetRequest?.user_name || payload.customer?.name || 'Athlete'}\n` +
        `📧 <b>Email:</b> ${targetRequest?.user_email || payload.customer?.email || '-'}\n` +
        `💰 <b>Nominal:</b> Rp ${amountPaid.toLocaleString('id-ID')}\n` +
        `📦 <b>Paket:</b> ${activatedPlan.toUpperCase()} PRO\n` +
        `🔖 <b>Invoice:</b> <code>${orderId}</code>\n` +
        `⏰ <b>Waktu:</b> ${timeStr} WIB\n\n` +
        `👑 <b>Status Akun: OTOMATIS AKTIF PRO 100%</b>`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: telegramMsg,
          parse_mode: 'HTML'
        })
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, orderId });

  } catch (error) {
    console.error('[doku-webhook] Handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
