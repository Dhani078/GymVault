import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QkDfIJZOVzZsO39jEdpI5w_fb4Bkavp';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8898525963:AAEKuNhil6t-lia7JvxKBIYQjDSDZOkkXfE';

  if (req.method !== 'POST') {
    return res.status(200).send('Telegram Webhook Endpoint');
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

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram-webhook] Error:', err);
    return res.status(200).json({ ok: true });
  }
}
