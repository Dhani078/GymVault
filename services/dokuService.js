import crypto from 'crypto';

export function getDokuConfig() {
  return {
    apiHost: process.env.DOKU_API_HOST || 'https://api.doku.com',
    clientId: process.env.DOKU_CLIENT_ID || '',
    secretKey: process.env.DOKU_SECRET_KEY || '',
  };
}

export function generateDokuHeaders(targetPath, jsonBody, customConfig = null) {
  const cfg = customConfig || getDokuConfig();
  const requestId = crypto.randomUUID();
  const requestTimestamp = new Date().toISOString().slice(0, 19) + 'Z';
  const digest = crypto.createHash('sha256').update(jsonBody).digest('base64');

  const signatureComponents = [
    `Client-Id:${cfg.clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${targetPath}`,
    `Digest:${digest}`,
  ].join('\n');

  const signature =
    'HMACSHA256=' +
    crypto.createHmac('sha256', cfg.secretKey).update(signatureComponents).digest('base64');

  return {
    'Client-Id': cfg.clientId,
    'Request-Id': requestId,
    'Request-Timestamp': requestTimestamp,
    Signature: signature,
    'Content-Type': 'application/json',
  };
}

export async function createDokuCheckout({ orderId, amountIdr, callbackUrl, resultUrl }) {
  const cfg = getDokuConfig();
  if (!cfg.clientId || !cfg.secretKey) {
    return {
      success: false,
      error: 'DOKU credentials not configured in environment',
      dokuActive: false,
    };
  }

  const targetPath = '/checkout/v1/payment';
  const body = {
    order: {
      amount: amountIdr,
      invoice_number: orderId,
      currency: 'IDR',
      callback_url: callbackUrl || 'https://gymvault-app.vercel.app/api/doku-webhook',
      callback_url_result: resultUrl || 'https://gymvault-app.vercel.app',
    },
    payment: {
      payment_due_date: 60, // 60 minutes
      payment_method_types: ['QRIS'], // Force official QRIS
    },
  };

  const jsonBody = JSON.stringify(body);
  const headers = generateDokuHeaders(targetPath, jsonBody, cfg);

  try {
    const res = await fetch(`${cfg.apiHost}${targetPath}`, {
      method: 'POST',
      headers,
      body: jsonBody,
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.response?.payment?.url) {
      return {
        success: true,
        paymentUrl: data.response.payment.url,
        invoiceNumber: orderId,
        dokuActive: true,
      };
    }

    return {
      success: false,
      error: data?.message?.[0] || data?.error?.message || 'DOKU payment creation failed',
      dokuActive: false,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      dokuActive: false,
    };
  }
}

export function verifyDokuNotification({
  clientId,
  requestId,
  requestTimestamp,
  signature,
  body,
  targetPath = '/api/doku-webhook',
  customSecretKey = null,
}) {
  const cfg = getDokuConfig();
  const secretKey = customSecretKey || cfg.secretKey;

  if (!clientId || !requestId || !requestTimestamp || !signature || !secretKey) {
    return false;
  }

  if (clientId !== cfg.clientId) {
    return false;
  }

  const digest = crypto.createHash('sha256').update(body).digest('base64');
  const signatureComponents = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${targetPath}`,
    `Digest:${digest}`,
  ].join('\n');

  const expectedSignature =
    'HMACSHA256=' +
    crypto.createHmac('sha256', secretKey).update(signatureComponents).digest('base64');

  try {
    const expectedBuf = Buffer.from(expectedSignature);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    return false;
  }
}
