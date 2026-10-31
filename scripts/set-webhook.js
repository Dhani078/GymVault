const fs = require('fs');
const path = require('path');

// Auto-load local .env if present (zero dependencies)
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0 && !trimmed.startsWith('#')) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
} catch (_) {}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;
const domainArg = process.argv[2];

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN tidak ditemukan di env.');
  process.exit(1);
}

if (!domainArg) {
  console.log('❌ Penggunaan: node scripts/set-webhook.js <URL_VERCEL_ANDA>');
  console.log('Contoh: node scripts/set-webhook.js https://gymvault-app.vercel.app');
  process.exit(1);
}

const cleanDomain = domainArg.replace(/\/$/, '');
const webhookUrl = `${cleanDomain}/api/telegram-webhook`;

console.log(`📡 Mendaftarkan Webhook ke Telegram: ${webhookUrl} ...`);
if (TELEGRAM_SECRET_TOKEN) {
  console.log('🔐 Secret token akan didaftarkan sekaligus.');
}

const body = { url: webhookUrl };
if (TELEGRAM_SECRET_TOKEN) body.secret_token = TELEGRAM_SECRET_TOKEN;

fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      console.log('✅ Webhook BERHASIL didaftarkan ke Telegram!');
      if (TELEGRAM_SECRET_TOKEN) console.log('🔐 Secret token aktif — webhook sekarang diproteksi.');
      console.log('Sekarang setiap kali tombol [ ACC ] / [ Tolak ] dipencet, server Vercel akan otomatis merespon 24/7 tanpa perlu menyalakan komputer.');
    } else {
      console.error('❌ Gagal mendaftarkan webhook:', data.description);
    }
  })
  .catch(err => console.error('❌ Error fetch:', err.message));
