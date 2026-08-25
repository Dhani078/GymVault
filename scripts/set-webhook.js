const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8898525963:AAEKuNhil6t-lia7JvxKBIYQjDSDZOkkXfE';
const domainArg = process.argv[2];

if (!domainArg) {
  console.log('❌ Penggunaan: node scripts/set-webhook.js <URL_VERCEL_ANDA>');
  console.log('Contoh: node scripts/set-webhook.js https://gymvault-app.vercel.app');
  process.exit(1);
}

const cleanDomain = domainArg.replace(/\/$/, '');
const webhookUrl = `${cleanDomain}/api/telegram-webhook`;

console.log(`📡 Mendaftarkan Webhook ke Telegram: ${webhookUrl} ...`);

fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`)
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      console.log('✅ Webhook BERHASIL didaftarkan ke Telegram!');
      console.log('Sekarang setiap kali tombol [ ACC ] / [ Tolak ] dipencet, server Vercel akan otomatis merespon 24/7 tanpa perlu menyalakan komputer.');
    } else {
      console.error('❌ Gagal mendaftarkan webhook:', data.description);
    }
  })
  .catch(err => console.error('❌ Error fetch:', err.message));
