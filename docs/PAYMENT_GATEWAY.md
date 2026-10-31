# GymVault DOKU QRIS Payment Gateway Integration

> Cryptographic security specification, transaction lifecycle, and HMAC-SHA256 verification protocol for DOKU QRIS integration.  
> Author: Dhani078  
> Version: 2.4.0  
> Module: `services/dokuService.js`

---

## 1. Architecture & Security Model

GymVault integrates directly with DOKU's official Checkout API to issue dynamic QRIS invoices and process asynchronous settlement notifications. The architecture is engineered around a fail-closed cryptographic security contract:

```text
┌─────────────────┐       1. Request Checkout        ┌─────────────────────┐
│                 ├─────────────────────────────────►│                     │
│  Athlete Client │                                  │  api/doku-checkout  │
│ (PaywallScreen) │◄─────────────────────────────────┤                     │
└────────┬────────┘       2. DOKU Payment URL        └──────────┬──────────┘
         │                                                      │
         │ 3. Scan & Pay QRIS                                   │ 4. Issue Invoice
         ▼                                                      ▼
┌─────────────────┐                                  ┌─────────────────────┐
│   Mobile Bank / │                                  │    DOKU Payment     │
│   E-Wallet App  ├─────────────────────────────────►│     Gate Server     │
└─────────────────┘          5. Settlement           └──────────┬──────────┘
                                                                │
                                                                │ 6. Signed Webhook
                                                                │    (HMAC-SHA256)
                                                                ▼
┌─────────────────┐       8. Atomic Provisioning     ┌─────────────────────┐
│    Supabase     │◄─────────────────────────────────┤                     │
│    Database     │                                  │   api/doku-webhook  │
└─────────────────┘       7. Instant Polling OK      │                     │
         ▲                                           └─────────────────────┘
         │                                                      │
         └──────────────────────────────────────────────────────┘
                   9. 3-Second Client Polling Closes Modal
```

---

## 2. Cryptographic Signature Generation

Every outbound API call to DOKU and every incoming webhook verification requires cryptographic signing using HMAC-SHA256.

### 2.1. Body Digest Calculation
Before calculating the signature, the JSON payload must be hashed with SHA-256 and base64-encoded:

$$\text{Digest} = \text{Base64}\left(\text{SHA-256}\left(\text{JSON Request Body}\right)\right)$$

### 2.2. Component String Assembly
The canonical signature component string is assembled with mandatory newline separators:

```text
Client-Id:{clientId}\n
Request-Id:{requestId}\n
Request-Timestamp:{isoTimestamp}\n
Request-Target:{requestTarget}\n
Digest:{digest}
```

### 2.3. HMAC-SHA256 Calculation
The component string is hashed using the shared merchant secret key:

$$\text{Signature} = \text{"HMACSHA256="} + \text{Base64}\left(\text{HMAC-SHA256}\left(\text{Secret Key}, \text{Component String}\right)\right)$$

---

## 3. Webhook Timing-Safe Verification

To neutralize side-channel timing attacks (where attackers observe minuscule execution time discrepancies in byte comparison), verification MUST utilize `crypto.timingSafeEqual`:

```javascript
export function verifyDokuNotification(rawBody, headers, requestTarget = '/api/doku-webhook') {
  const clientId = headers['client-id'] || headers['Client-Id'];
  const requestId = headers['request-id'] || headers['Request-Id'];
  const timestamp = headers['request-timestamp'] || headers['Request-Timestamp'];
  const incomingSignature = headers['signature'] || headers['Signature'];

  if (!clientId || !requestId || !timestamp || !incomingSignature) {
    return false; // Fail-closed on missing headers
  }

  // Calculate local digest
  const bodyString = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
  const digest = crypto.createHash('sha256').update(bodyString, 'utf-8').digest('base64');

  // Reconstruct component string
  const componentString = 
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${timestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  // Calculate local HMAC
  const expectedSignature = 'HMACSHA256=' + crypto
    .createHmac('sha256', process.env.DOKU_SECRET_KEY)
    .update(componentString)
    .digest('base64');

  // Constant-time buffer comparison
  const expectedBuf = Buffer.from(expectedSignature);
  const incomingBuf = Buffer.from(incomingSignature);

  if (expectedBuf.length !== incomingBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, incomingBuf);
}
```

---

## 4. Replay Attack Mitigation

To ensure webhook payloads cannot be captured and replayed maliciously by third parties:

1. Idempotency Check: Every transaction record in `payment_requests` has a strict unique constraint on `id`.
2. Status Guardrail: The RPC `approve_payment_request` validates that `status == 'pending'`. If already marked `'approved'`, subsequent duplicate callbacks are rejected as no-ops.
3. Timestamp Window: Notifications with timestamps older than 5 minutes ($\pm 300\,\text{seconds}$) from the server system clock are rejected.

---

## 5. Client Real-Time Auto-Polling

When an athlete initiates payment via `screens/PaywallScreen.js`:

1. The client opens the official DOKU QRIS page via browser.
2. A background polling loop queries the user's `is_premium` status from Supabase every 3 seconds:
   ```javascript
   useEffect(() => {
     if (!isPaying) return;
     const pollTimer = setInterval(async () => {
       const { data } = await supabase
         .from('users_profile')
         .select('is_premium')
         .eq('id', session.user.id)
         .single();

       if (data?.is_premium) {
         clearInterval(pollTimer);
         setIsPaying(false);
         showSuccessModal();
       }
     }, 3000);

     return () => clearInterval(pollTimer);
   }, [isPaying]);
   ```
3. Once the webhook completes execution on the edge server, the client immediately updates with zero manual intervention or receipt uploading required.

---

## 6. Automated Unit Verification

The DOKU gateway engine is verified automatically via `scripts/test-doku.js`:
- `PASS:` Header & HMAC-SHA256 signature generator format validation.
- `PASS:` Timing-safe verification of legitimate signatures.
- `PASS:` Immediate rejection of tampered body content (anti-spoofing).
- `PASS:` Immediate rejection of forged signature keys.
