import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QkDfIJZOVzZsO39jEdpI5w_fb4Bkavp';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8898525963:AAEKuNhil6t-lia7JvxKBIYQjDSDZOkkXfE';

console.log('🤖 [GymVault Bot Listener] Starting Telegram polling listener...');

let offset = 0;

async function processUpdate(update) {
  if (!update.callback_query) return;

  const callbackQuery = update.callback_query;
  const callbackId = callbackQuery.id;
  const callbackData = callbackQuery.data; // e.g. "acc:<requestId>" or "reject:<requestId>"
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const originalText = callbackQuery.message?.caption || callbackQuery.message?.text || '';

  const [action, requestId] = (callbackData || '').split(':');

  console.log(`⚡ [Bot Listener] Received Action: ${action}, Request ID: ${requestId}`);

  const timeStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  if (action === 'acc') {
    // 1. Call Supabase RPC to approve
    try {
      if (requestId && requestId !== 'pay-37flash-active') {
        const { error } = await supabase.rpc('approve_payment_request', { request_id: requestId });
        if (error) console.warn('[Bot Listener] RPC Error (ACC):', error.message);
      }
    } catch (e) {
      console.warn('[Bot Listener] RPC Exception:', e.message);
    }

    // 2. Send Telegram Alert Popup
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackId,
        text: '✅ Pembayaran Berhasil di-ACC! Status Pro Aktif.',
        show_alert: true
      })
    });

    // 3. Edit Message In-Place
    const updatedCaption = `${originalText}\n\n✅ <b>STATUS: TELAH DI-ACC OLEH ADMIN</b>\n👑 <i>Akun user otomatis aktif Premium Pro!</i> (${timeStr} WIB)`;

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

    console.log(`✅ [Bot Listener] Successfully ACC-ed request ${requestId}`);

  } else if (action === 'reject') {
    // 1. Call Supabase RPC to reject
    try {
      if (requestId && requestId !== 'pay-37flash-active') {
        const { error } = await supabase.rpc('reject_payment_request', { request_id: requestId });
        if (error) console.warn('[Bot Listener] RPC Error (Reject):', error.message);
      }
    } catch (e) {
      console.warn('[Bot Listener] RPC Exception:', e.message);
    }

    // 2. Send Telegram Alert
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackId,
        text: '❌ Pembayaran Ditolak.',
        show_alert: false
      })
    });

    // 3. Edit Message In-Place
    const updatedCaption = `${originalText}\n\n❌ <b>STATUS: DITOLAK OLEH ADMIN</b> (${timeStr} WIB)`;

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

    console.log(`❌ [Bot Listener] Successfully Rejected request ${requestId}`);
  }
}

async function poll() {
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=20`);
      const data = await res.json();

      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await processUpdate(update);
        }
      }
    } catch (err) {
      console.error('[Bot Listener] Poll error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll();
