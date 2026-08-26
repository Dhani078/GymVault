const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QkDfIJZOVzZsO39jEdpI5w_fb4Bkavp';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8898525963:AAEKuNhil6t-lia7JvxKBIYQjDSDZOkkXfE';

async function sendTelegramMessage(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Failed to send Telegram message:', e.message);
  }
}

async function handleMessage(msg) {
  const text = (msg.text || '').trim();
  const chatId = msg.chat.id;

  console.log(`[Telegram Bot] Incoming: "${text}" from Chat ${chatId}`);

  if (text.startsWith('/start') || text.startsWith('/help') || text.startsWith('/starts')) {
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
    await sendTelegramMessage(chatId, helpText);
    return;
  }

  // 1. /stats
  if (text.startsWith('/stats')) {
    const { data: users, count: totalUsers } = await supabase.from('users_profile').select('id, is_pro, created_at', { count: 'exact' });
    const { data: payments } = await supabase.from('payment_requests').select('amount, status').eq('status', 'approved');
    const { count: totalSessions } = await supabase.from('workout_sessions').select('id', { count: 'exact' });

    const proCount = (users || []).filter(u => u.is_pro).length;
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

    await sendTelegramMessage(chatId, statsMsg);
    return;
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

    await sendTelegramMessage(chatId, growthMsg);
    return;
  }

  // 3. /recent
  if (text.startsWith('/recent')) {
    const { data: recentPayments } = await supabase.from('payment_requests').select('id, amount, status, email, created_at').order('created_at', { ascending: false }).limit(5);
    const { data: recentSessions } = await supabase.from('workout_sessions').select('id, name, duration_seconds, created_at').order('created_at', { ascending: false }).limit(5);

    let paymentsText = (recentPayments || []).map(p => `• <b>${p.email || 'User'}</b>: Rp ${Number(p.amount).toLocaleString('id-ID')} [${p.status.toUpperCase()}]`).join('\n') || 'Belum ada transaksi.';
    let sessionsText = (recentSessions || []).map(s => `• <b>${s.name || 'Workout'}</b> (${Math.round((s.duration_seconds || 0)/60)} mnt)`).join('\n') || 'Belum ada sesi.';

    const recentMsg = 
`📋 <b>5 AKTIVITAS TERBARU DI GYMVAULT</b>
━━━━━━━━━━━━━━━━━
💳 <b>Pembayaran Terakhir:</b>
${paymentsText}

🏋️‍♂️ <b>Sesi Latihan Terakhir:</b>
${sessionsText}`;

    await sendTelegramMessage(chatId, recentMsg);
    return;
  }

  // 4. /check <email>
  if (text.startsWith('/check')) {
    const query = text.replace('/check', '').trim();
    if (!query) {
      await sendTelegramMessage(chatId, '⚠️ <b>Format salah.</b> Contoh: <code>/check user@gmail.com</code>');
      return;
    }

    const { data: user } = await supabase
      .from('users_profile')
      .select('id, full_name, email, is_pro, pro_expires_at, fitness_level, body_weight, height, created_at')
      .ilike('email', `%${query}%`)
      .limit(1)
      .single();

    if (!user) {
      await sendTelegramMessage(chatId, `❌ User dengan kata kunci <code>${query}</code> tidak ditemukan.`);
      return;
    }

    const { count: userWorkouts } = await supabase
      .from('workout_sessions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const checkMsg = 
`👤 <b>PROFIL MEMBER GYMVAULT</b> 🏋️‍♂️
━━━━━━━━━━━━━━━━━
📛 <b>Nama:</b> ${user.full_name || 'Lifter GymVault'}
📧 <b>Email:</b> <code>${user.email || query}</code>
👑 <b>Status Pro:</b> ${user.is_pro ? '👑 <b>PRO ACTIVE</b>' : '⚪ Free User'}
⏳ <b>Masa Aktif:</b> ${user.pro_expires_at ? new Date(user.pro_expires_at).toLocaleDateString('id-ID') : 'N/A'}
⚖️ <b>Fisik:</b> ${user.body_weight || '-'} kg · ${user.height || '-'} cm (${user.fitness_level || 'Beginner'})
🔥 <b>Sesi Latihan:</b> ${userWorkouts || 0} sesi tercatat`;

    await sendTelegramMessage(chatId, checkMsg);
    return;
  }

  // 5. /grant <email> [days]
  if (text.startsWith('/grant')) {
    const parts = text.replace('/grant', '').trim().split(/\s+/);
    const emailQuery = parts[0];
    const days = parseInt(parts[1], 10) || 30;

    if (!emailQuery) {
      await sendTelegramMessage(chatId, '⚠️ <b>Format salah.</b> Contoh: <code>/grant user@gmail.com 30</code>');
      return;
    }

    const { data: user } = await supabase.from('users_profile').select('id, email, full_name').ilike('email', `%${emailQuery}%`).limit(1).single();
    if (!user) {
      await sendTelegramMessage(chatId, `❌ User <code>${emailQuery}</code> tidak ditemukan.`);
      return;
    }

    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('users_profile').update({ is_pro: true, pro_expires_at: expiryDate }).eq('id', user.id);
    await supabase.from('profiles').update({ is_pro: true, pro_expires_at: expiryDate }).eq('id', user.id);

    await sendTelegramMessage(chatId, `👑 <b>STATUS PRO BERHASIL DIAKTIFKAN!</b>\n\nUser: <b>${user.full_name || user.email}</b> (<code>${user.email}</code>)\nMasa Aktif: +${days} hari (hingga ${new Date(expiryDate).toLocaleDateString('id-ID')}).`);
    return;
  }

  // 6. /revoke <email>
  if (text.startsWith('/revoke')) {
    const emailQuery = text.replace('/revoke', '').trim();
    if (!emailQuery) {
      await sendTelegramMessage(chatId, '⚠️ <b>Format salah.</b> Contoh: <code>/revoke user@gmail.com</code>');
      return;
    }

    const { data: user } = await supabase.from('users_profile').select('id, email, full_name').ilike('email', `%${emailQuery}%`).limit(1).single();
    if (!user) {
      await sendTelegramMessage(chatId, `❌ User <code>${emailQuery}</code> tidak ditemukan.`);
      return;
    }

    await supabase.from('users_profile').update({ is_pro: false, pro_expires_at: null }).eq('id', user.id);
    await supabase.from('profiles').update({ is_pro: false, pro_expires_at: null }).eq('id', user.id);

    await sendTelegramMessage(chatId, `⛔ <b>STATUS PRO DICABUT!</b>\n\nUser: <b>${user.full_name || user.email}</b> (<code>${user.email}</code>) sekarang kembali ke Free tier.`);
    return;
  }

  // 7. /broadcast <pesan>
  if (text.startsWith('/broadcast')) {
    const announcement = text.replace('/broadcast', '').trim();
    if (!announcement) {
      await sendTelegramMessage(chatId, '⚠️ <b>Format salah.</b> Contoh: <code>/broadcast Pengumuman: Gym buka jam 06.00 WIB!</code>');
      return;
    }

    await supabase.from('system_notifications').insert({
      title: '📢 Pengumuman GymVault',
      message: announcement,
      created_at: new Date().toISOString()
    }).select();

    await sendTelegramMessage(chatId, `✅ <b>BROADCAST BERHASIL DIKIRIM!</b> 📢\n\nIsi Pesan:\n<i>"${announcement}"</i>\n\nSemua atlet GymVault yang membuka aplikasi akan menerima notifikasi ini.`);
    return;
  }

  // 8. /clearnotif
  if (text.startsWith('/clearnotif')) {
    await supabase.from('system_notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await sendTelegramMessage(chatId, '🧹 <b>Seluruh notifikasi broadcast lama berhasil dibersihkan!</b>');
    return;
  }
}

async function startPolling() {
  console.log('🤖 Menyiapkan GymVault Telegram Bot Polling...');
  // Delete webhook so polling works smoothly in local dev
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
  console.log('✅ Webhook dibersihkan. Memulai polling live...');

  let offset = 0;
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startPolling();
