import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[telegram-webhook] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY env vars');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN; // set di BotFather webhook secret

  if (req.method !== 'POST') {
    return res.status(200).send('Telegram Webhook Endpoint');
  }

  // Verifikasi Telegram secret token kalau dikonfigurasi
  if (TELEGRAM_SECRET_TOKEN && req.headers['x-telegram-bot-api-secret-token'] !== TELEGRAM_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const update = req.body;

    // 1. Handle Callback Query (Button Clicks)
    if (update?.callback_query) {
      const callbackQuery = update.callback_query;
      const callbackData = callbackQuery.data; // e.g. "acc:<requestId>" or "reject:<requestId>"
      const callbackId = callbackQuery.id;
      const chatId = callbackQuery.message?.chat?.id;
      const messageId = callbackQuery.message?.message_id;
      const originalText = callbackQuery.message?.caption || callbackQuery.message?.text || '';

      const [action, requestId] = (callbackData || '').split(':');

      if (action === 'acc' && requestId) {
        // Execute approval RPC
        await supabase.rpc('approve_payment_request', {
          request_id: requestId
        });

        const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: '✅ Pembayaran berhasil di-ACC! Akun user sudah aktif Pro.',
            show_alert: true
          })
        });

        const updatedCaption = 
`${originalText}

✅ <b>STATUS: TELAH DI-ACC OLEH ADMIN</b>
👑 <b>Akun user otomatis aktif Premium!</b> (${timeStr} WIB)`;

        if (callbackQuery.message?.photo) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageCaption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              caption: updatedCaption,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [] }
            })
          });
        } else {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: updatedCaption,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [] }
            })
          });
        }

      } else if (action === 'reject' && requestId) {
        await supabase.rpc('reject_payment_request', {
          request_id: requestId
        });

        const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackId,
            text: '❌ Pembayaran ditolak.',
            show_alert: false
          })
        });

        const updatedCaption = 
`${originalText}

❌ <b>STATUS: DITOLAK OLEH ADMIN</b> (${timeStr} WIB)`;

        if (callbackQuery.message?.photo) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageCaption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              caption: updatedCaption,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [] }
            })
          });
        } else {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: updatedCaption,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [] }
            })
          });
        }
      }
    }

    // 2. Handle Text Commands (/stats, /check, /broadcast, /help)
    if (update?.message?.text) {
      const msg = update.message;
      const text = (msg.text || '').trim();
      const chatId = msg.chat.id;

      const sendReply = async (replyHtml) => {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyHtml,
            parse_mode: 'HTML'
          })
        });
      };

      if (text.startsWith('/start') || text.startsWith('/help')) {
        const helpText = 
`👑 <b>GYMVAULT SUPER-ADMIN COMMAND CENTER</b> 🚀
<i>Pusat Kendali SaaS & Manajemen Atlet</i>

📊 <b>METRIK & ANALITIK:</b>
• <code>/stats</code> — Ringkasan GMV pendapatan, lifter aktif, dan total sesi.
• <code>/growth</code> — Laporan pertumbuhan pengguna & sesi 7 hari terakhir.
• <code>/recent</code> — 5 pembayaran & sesi latihan terbaru.

🔍 <b>MANAJEMEN PENGGUNA:</b>
• <code>/check email@user.com</code> — Cek profil, status Pro, & riwayat latihan.
• <code>/grant email@user.com 30</code> — Aktifkan Pro manual selama X hari.
• <code>/revoke email@user.com</code> — Cabut status Pro pengguna.

📢 <b>BROADCAST & PENGUMUMAN:</b>
• <code>/broadcast &lt;pesan&gt;</code> — Kirim notifikasi banner ke semua pengguna.
• <code>/clearnotif</code> — Bersihkan riwayat notifikasi lama.
• <code>/help</code> — Tampilkan menu bantuan ini.`;
        await sendReply(helpText);
        return res.status(200).json({ ok: true });
      }

      // 1. /stats
      if (text.startsWith('/stats')) {
        const { data: users, count: totalUsers } = await supabase.from('users_profile').select('id, is_premium, created_at', { count: 'exact' });
        const { data: payments } = await supabase.from('payment_requests').select('amount, status').eq('status', 'approved');
        const { count: totalSessions } = await supabase.from('workout_sessions').select('id', { count: 'exact' });

        const proCount = (users || []).filter(u => u.is_premium).length;
        let totalRevenue = 0;
        (payments || []).forEach(p => {
          totalRevenue += (parseInt(p.amount, 10) || 0);
        });

        const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const statsMsg = 
`📊 <b>RINGKASAN METRIK SAAS GYMVAULT</b> 🏋️‍♂️⚡
<i>Update per: ${timeStr} WIB</i>

💰 <b>Total Pendapatan (GMV):</b> Rp ${totalRevenue.toLocaleString('id-ID')}
👥 <b>Total Lifter Terdaftar:</b> ${totalUsers || 0} akun
👑 <b>Member Pro Aktif:</b> ${proCount} user (${totalUsers ? Math.round((proCount / totalUsers) * 100) : 0}%)
🔥 <b>Total Sesi Latihan Selesai:</b> ${totalSessions || 0} sesi
⚡ <b>Status Server / Webhook:</b> 🟢 ONLINE & 100% OPERATIONAL`;

        await sendReply(statsMsg);
        return res.status(200).json({ ok: true });
      }

      // 2. /growth
      if (text.startsWith('/growth')) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: newUsersWeek } = await supabase.from('users_profile').select('id', { count: 'exact' }).gte('created_at', sevenDaysAgo);
        const { count: sessionsWeek } = await supabase.from('workout_sessions').select('id', { count: 'exact' }).gte('created_at', sevenDaysAgo);
        const { data: paymentsWeek } = await supabase.from('payment_requests').select('amount').eq('status', 'approved').gte('created_at', sevenDaysAgo);

        let gmvWeek = 0;
        (paymentsWeek || []).forEach(p => {
          gmvWeek += (parseInt(p.amount, 10) || 0);
        });

        const growthMsg = 
`📈 <b>LAPORAN PERTUMBUHAN 7 HARI TERAKHIR</b> 🚀
━━━━━━━━━━━━━━━━━
👥 <b>Registrasi Baru:</b> +${newUsersWeek || 0} lifter
🔥 <b>Sesi Latihan Minggu Ini:</b> ${sessionsWeek || 0} sesi
💰 <b>Pendapatan 7 Hari:</b> Rp ${gmvWeek.toLocaleString('id-ID')}
🎯 <b>Momentum:</b> 🟢 Pertumbuhan Komunitas Positif!`;

        await sendReply(growthMsg);
        return res.status(200).json({ ok: true });
      }

      // 3. /recent
      if (text.startsWith('/recent')) {
        const { data: recentPayments } = await supabase.from('payment_requests').select('id, amount, status, user_email, created_at').order('created_at', { ascending: false }).limit(5);
        const { data: recentSessions } = await supabase.from('workout_sessions').select('id, split_name, started_at').order('started_at', { ascending: false }).limit(5);

        let paymentsText = (recentPayments || []).map(p => `• <b>${p.user_email || 'User'}</b>: Rp ${Number(p.amount).toLocaleString('id-ID')} [${p.status.toUpperCase()}]`).join('\n') || 'Belum ada transaksi.';
        let sessionsText = (recentSessions || []).map(s => `• <b>${s.split_name || 'Workout'}</b>`).join('\n') || 'Belum ada sesi.';

        const recentMsg = 
`📋 <b>5 AKTIVITAS TERBARU DI GYMVAULT</b>
━━━━━━━━━━━━━━━━━
💳 <b>Pembayaran Terakhir:</b>
${paymentsText}

🏋️‍♂️ <b>Sesi Latihan Terakhir:</b>
${sessionsText}`;

        await sendReply(recentMsg);
        return res.status(200).json({ ok: true });
      }

      // 4. /check <email>
      if (text.startsWith('/check')) {
        const query = text.replace('/check', '').trim();
        if (!query) {
          await sendReply('⚠️ <b>Format salah.</b> Contoh: <code>/check user@gmail.com</code>');
          return res.status(200).json({ ok: true });
        }

        const { data: user } = await supabase
          .from('users_profile')
          .select('id, name, email, is_premium, premium_until, body_weight, height, created_at')
          .ilike('email', `%${query}%`)
          .limit(1)
          .single();

        if (!user) {
          await sendReply(`❌ User dengan kata kunci <code>${query}</code> tidak ditemukan.`);
          return res.status(200).json({ ok: true });
        }

        const { count: userWorkouts } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        const checkMsg = 
`👤 <b>PROFIL MEMBER GYMVAULT</b> 🏋️‍♂️
━━━━━━━━━━━━━━━━━
📛 <b>Nama:</b> ${user.name || 'Lifter GymVault'}
📧 <b>Email:</b> <code>${user.email || query}</code>
👑 <b>Status Pro:</b> ${user.is_premium ? '👑 <b>PRO ACTIVE</b>' : '⚪ Free User'}
⏳ <b>Masa Aktif:</b> ${user.premium_until ? new Date(user.premium_until).toLocaleDateString('id-ID') : 'N/A'}
⚖️ <b>Fisik:</b> ${user.body_weight || '-'} kg · ${user.height || '-'} cm
🔥 <b>Sesi Latihan:</b> ${userWorkouts || 0} sesi tercatat`;

        await sendReply(checkMsg);
        return res.status(200).json({ ok: true });
      }

      // 5. /grant <email> [days]
      if (text.startsWith('/grant')) {
        const parts = text.replace('/grant', '').trim().split(/\s+/);
        const emailQuery = parts[0];
        const days = parseInt(parts[1], 10) || 30;

        if (!emailQuery) {
          await sendReply('⚠️ <b>Format salah.</b> Contoh: <code>/grant user@gmail.com 30</code>');
          return res.status(200).json({ ok: true });
        }

        const { data: user } = await supabase.from('users_profile').select('id, email, name').ilike('email', `%${emailQuery}%`).limit(1).single();
        if (!user) {
          await sendReply(`❌ User <code>${emailQuery}</code> tidak ditemukan.`);
          return res.status(200).json({ ok: true });
        }

        const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('users_profile').update({ is_premium: true, premium_until: expiryDate }).eq('id', user.id);

        await sendReply(`👑 <b>STATUS PRO BERHASIL DIAKTIFKAN!</b>\n\nUser: <b>${user.name || user.email}</b> (<code>${user.email}</code>)\nMasa Aktif: +${days} hari (hingga ${new Date(expiryDate).toLocaleDateString('id-ID')}).`);
        return res.status(200).json({ ok: true });
      }

      // 6. /revoke <email>
      if (text.startsWith('/revoke')) {
        const emailQuery = text.replace('/revoke', '').trim();
        if (!emailQuery) {
          await sendReply('⚠️ <b>Format salah.</b> Contoh: <code>/revoke user@gmail.com</code>');
          return res.status(200).json({ ok: true });
        }

        const { data: user } = await supabase.from('users_profile').select('id, email, name').ilike('email', `%${emailQuery}%`).limit(1).single();
        if (!user) {
          await sendReply(`❌ User <code>${emailQuery}</code> tidak ditemukan.`);
          return res.status(200).json({ ok: true });
        }

        await supabase.from('users_profile').update({ is_premium: false, premium_until: null }).eq('id', user.id);

        await sendReply(`⛔ <b>STATUS PRO DICABUT!</b>\n\nUser: <b>${user.name || user.email}</b> (<code>${user.email}</code>) sekarang kembali ke Free tier.`);
        return res.status(200).json({ ok: true });
      }

      // 7. /broadcast <pesan>
      if (text.startsWith('/broadcast')) {
        const announcement = text.replace('/broadcast', '').trim();
        if (!announcement) {
          await sendReply('⚠️ <b>Format salah.</b> Contoh: <code>/broadcast Pengumuman: Gym buka jam 06.00 WIB!</code>');
          return res.status(200).json({ ok: true });
        }

        await supabase.from('system_notifications').insert({
          title: '📢 Pengumuman GymVault',
          message: announcement,
          created_at: new Date().toISOString()
        }).select();

        await sendReply(`✅ <b>BROADCAST BERHASIL DIKIRIM!</b> 📢\n\nIsi Pesan:\n<i>"${announcement}"</i>\n\nSemua atlet GymVault yang membuka aplikasi akan menerima notifikasi ini.`);
        return res.status(200).json({ ok: true });
      }

      // 8. /clearnotif
      if (text.startsWith('/clearnotif')) {
        await supabase.from('system_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await sendReply('🧹 <b>Seluruh notifikasi broadcast lama berhasil dibersihkan!</b>');
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram-webhook] Error:', err);
    return res.status(200).json({ ok: true });
  }
}
