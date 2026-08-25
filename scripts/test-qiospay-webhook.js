// scripts/test-qiospay-webhook.js
// Test script to simulate an incoming Qiospay QRIS callback to the live production endpoint

async function testQiospayWebhook() {
  const url = 'https://gymvault-app.vercel.app/api/qiospay-callback';
  
  const mockPayload = {
    status: 'success',
    data: {
      name: 'Dhani (Test Runner)',
      nmid: 'ID1026500560192',
      amount: 29000,
      type: 'CR',
      fee: 0,
      refid: Math.floor(100000000 + Math.random() * 900000000),
      issuer: '93600002',
      balance: '50000',
      time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    }
  };

  console.log('🚀 Sending Simulated Qiospay Callback to:', url);
  console.log('📦 Payload:', JSON.stringify(mockPayload, null, 2));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });

    const json = await res.json();
    console.log('\n✅ Response Status:', res.status);
    console.log('📄 Response Body:', json);

    if (json.success) {
      console.log('\n🎉 TEST SUKSES! Webhook Qiospay berhasil diproses & notifikasi Telegram terkirim!');
    } else {
      console.log('\n⚠️ Respon:', json);
    }
  } catch (err) {
    console.error('❌ Error sending webhook test:', err);
  }
}

testQiospayWebhook();
