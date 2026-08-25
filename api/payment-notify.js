import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QkDfIJZOVzZsO39jEdpI5w_fb4Bkavp';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Target Account Details for Validation
const VALID_DESTINATIONS = {
  qrisMerchant: {
    name: 'Dhani',
    nmid: 'ID1026500560192'
  },
  personalDana: {
    name: 'MUHAMMAD RIZKI RAMADHANI',
    phone: '082148564979'
  }
};

// Prioritized Model Waterfall Switch (Auto-Fallback)
const GEMINI_MODEL_CASCADE = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash'
];

async function analyzeReceiptWithGemini(base64Image, expectedAmount) {
  const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_API_KEY || !base64Image) return null;

  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  const now = new Date();
  const currentDateWIB = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' });
  const currentShortDate = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric' });

  const prompt = 
    `Anda adalah AI Audit & Fraud Detection Pembayaran GymVault yang sangat teliti dan berstandar tinggi.\n\n` +
    `Tugas Anda adalah memeriksa foto struk transfer / bukti bayar ini dengan aturan ketat berikut:\n` +
    `1. REKENING / QRIS TUJUAN HARUS SALAH SATU DARI:\n` +
    `   - QRIS DANA Bisnis: Nama "${VALID_DESTINATIONS.qrisMerchant.name}" atau NMID "${VALID_DESTINATIONS.qrisMerchant.nmid}"\n` +
    `   - DANA Personal / Transfer: Nama "${VALID_DESTINATIONS.personalDana.name}" atau Nomor "${VALID_DESTINATIONS.personalDana.phone}"\n` +
    `2. NOMINAL TARGET: Rp ${expectedAmount} (Beri toleransi jika ada kode unik transfer misal selisih 1-999 rupiah).\n` +
    `3. STATUS TRANSAKSI: Harus tertulis "BERHASIL", "SELESAI", atau "SUCCESS". Jika "MENUNGGU", "PROSES", atau "GAGAL", maka TIDAK VALID.\n` +
    `4. TANGGAL & WAKTU: Periksa tanggal transaksi pada struk. Hari ini adalah sekitar: "${currentDateWIB}" atau "${currentShortDate}". Jika struk berasal dari hari kemarin, minggu lalu, atau tahun lama, tandai TIDAK VALID.\n` +
    `5. DETEKSI FRAUD / EDITAN: Periksa apakah ada ketidakcocokan font, glitch pixel, atau tanda struk palsu buatan web generator.\n\n` +
    `Kembalikan respon DALAM FORMAT JSON MURNI (tanpa markdown backtick):\n` +
    `{\n` +
    `  "isValid": boolean,\n` +
    `  "statusFound": "BERHASIL" | "MENUNGGU" | "GAGAL" | "TIDAK_DIKETAHUI",\n` +
    `  "destinationMatch": boolean,\n` +
    `  "destinationNameFound": string,\n` +
    `  "nominalDetected": number,\n` +
    `  "dateDetected": string,\n` +
    `  "isDateValidToday": boolean,\n` +
    `  "confidenceScore": number,\n` +
    `  "fraudAnalysis": string\n` +
    `}`;

  // Loop through models in cascade order
  for (const modelName of GEMINI_MODEL_CASCADE) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      });

      const result = await response.json();
      if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const parsed = JSON.parse(result.candidates[0].content.parts[0].text);
        parsed.modelUsed = modelName;
        return parsed;
      }

      if (result?.error) {
        console.warn(`[Gemini Cascade] ${modelName} error (${result.error.code}), switching to next model...`);
      }
    } catch (modelErr) {
      console.warn(`[Gemini Cascade] ${modelName} exception, falling back...`, modelErr.message);
    }
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, userName, userEmail, plan, amount, proofImageBase64 } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: 'Missing userId or plan' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8898525963:AAEKuNhil6t-lia7JvxKBIYQjDSDZOkkXfE';
    const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '1224442718';

    const targetAmount = amount || (plan === 'yearly' ? 199900 : 29900);

    // 1. Run Smart Gemini Multi-Model Cascade Verification
    let aiReport = null;
    if (proofImageBase64) {
      aiReport = await analyzeReceiptWithGemini(proofImageBase64, targetAmount);
    }

    // 2. Insert into Supabase payment_requests
    const { data: payReq, error: dbError } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        user_name: userName || 'Gym Athlete',
        user_email: userEmail || '',
        plan: plan,
        amount: targetAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('[payment-notify] DB Error:', dbError);
    }

    const requestId = payReq?.id || userId;
    const planName = plan === 'yearly' ? 'Tahunan (Rp 199.900)' : 'Bulanan (Rp 29.900)';
    const dateFormatted = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    let aiSummaryHtml = '';
    if (aiReport) {
      const isOk = aiReport.isValid && aiReport.confidenceScore >= 80;
      aiSummaryHtml = 
`🤖 <b>AUDIT GEMINI AI (${aiReport.modelUsed || 'Gemini'})</b>
├ <b>Status:</b> ${isOk ? '✅ STRUK VALID & ASLI' : '⚠️ PERLU PERHATIAN'}
├ <b>Skor Keaslian:</b> ${aiReport.confidenceScore}%
├ <b>Penerima:</b> ${aiReport.destinationNameFound || '-'} (${aiReport.destinationMatch ? '✅ Cocok' : '❌ Salah Tujuan'})
├ <b>Nominal Terbaca:</b> Rp ${(aiReport.nominalDetected || 0).toLocaleString('id-ID')}
├ <b>Tanggal Struk:</b> ${aiReport.dateDetected || '-'} (${aiReport.isDateValidToday ? '✅ Hari Ini' : '⚠️ Tanggal Beda'})
└ <b>Analisis:</b> <i>${aiReport.fraudAnalysis || 'Pemeriksaan selesai'}</i>\n\n`;
    }

    const htmlMessage = 
`🔔 <b>NOTIFIKASI PEMBAYARAN QRIS DANA</b>

👤 <b>User:</b> ${userName || 'Athlete'}
📧 <b>Email:</b> ${userEmail || '-'}
📦 <b>Paket:</b> ${planName}
💰 <b>Nominal:</b> Rp ${targetAmount.toLocaleString('id-ID')}
🕒 <b>Waktu:</b> ${dateFormatted} WIB
🆔 <b>ID Transaksi:</b> <code>${requestId}</code>

${aiSummaryHtml}👇 <i>Klik tombol di bawah untuk ACC atau Tolak:</i>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ ACC / AKTIFKAN PRO', callback_data: `acc:${requestId}` },
          { text: '❌ TOLAK', callback_data: `reject:${requestId}` }
        ]
      ]
    };

    // 3. Send to Telegram Admin using clean HTML
    if (proofImageBase64) {
      const cleanBase64 = proofImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(cleanBase64, 'base64');
      
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_ADMIN_CHAT_ID);
      formData.append('caption', htmlMessage);
      formData.append('parse_mode', 'HTML');
      formData.append('reply_markup', JSON.stringify(inlineKeyboard));
      
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('photo', blob, 'bukti_transfer.jpg');

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    } else {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_CHAT_ID,
          text: htmlMessage,
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notifikasi pembayaran berhasil dikirim ke Admin.',
      requestId: requestId,
      aiAnalysis: aiReport
    });

  } catch (error) {
    console.error('[payment-notify] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
