# GymVault API Specification & Endpoint Documentation

> Master specification for all Vercel Serverless Edge endpoints serving GymVault.  
> Author: **Dhani078**  
> Version: **2.4.0**  
> Base URL: `https://gymvault-app.vercel.app`

---

## 1. Authentication & Security Headers

All client API interactions authenticate via Supabase JWT or cryptographic HMAC signatures.

| Header | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Authorization` | `Bearer <token>` | Yes (Client APIs) | Valid Supabase user session access token. |
| `Client-Id` | `string` | Yes (DOKU APIs) | Merchant Client ID issued by DOKU. |
| `Request-Id` | `UUID / string` | Yes (DOKU APIs) | Unique idempotency identifier for payment request. |
| `Request-Timestamp` | `ISO 8601 UTC` | Yes (DOKU APIs) | Timestamp formatted as `YYYY-MM-DDTHH:mm:ssZ`. |
| `Signature` | `string` | Yes (DOKU APIs) | Cryptographic HMAC-SHA256 signature (`HMACSHA256=...`). |
| `x-webhook-secret` | `string` | Yes (Internal Webhooks) | Pre-shared secret key validating internal webhook calls. |

---

## 2. Serverless Endpoints Reference

### 2.1. `POST /api/doku-checkout`
Generates an official DOKU QRIS checkout session, records a pending payment in `payment_requests`, and returns the merchant payment URL.

- **Access Level:** Authenticated User
- **Rate Limit:** 5 requests / minute per user

#### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <supabase_jwt>
```

#### Request Body
```json
{
  "userId": "d3b07384-d113-4f24-bc6d-000000000000",
  "userName": "Dhani Lifter",
  "userEmail": "athlete@example.com",
  "plan": "monthly",
  "amount": 29000
}
```

#### Field Specifications
| Parameter | Type | Required | Rules |
| :--- | :--- | :--- | :--- |
| `userId` | `string (UUID)` | Yes | Must match authenticated `auth.uid()`. |
| `userName` | `string` | Yes | 2–50 characters, sanitized string. |
| `userEmail`| `string (Email)`| Yes | RFC 5322 compliant email string. |
| `plan` | `string` | Yes | Must be `"monthly"` or `"yearly"`. |
| `amount` | `number` | Yes | Must match exact plan pricing (29000 or 199000). |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "invoiceNumber": "GYM-1719398400000-d3b07384",
  "paymentUrl": "https://checkout.doku.com/payment/xyz...",
  "expiredDate": "2026-10-27T10:00:00Z"
}
```

#### Error Responses
- `400 Bad Request`: Missing mandatory parameters or invalid plan type.
- `401 Unauthorized`: Missing or expired Supabase authentication header.
- `502 Bad Gateway`: DOKU upstream payment gateway unreachable.

---

### 2.2. `POST /api/doku-webhook`
Handles settlement notifications pushed by DOKU upon successful QRIS scan and payment completion. Employs constant-time HMAC validation to prevent timing attacks.

- **Access Level:** DOKU Payment Server (Verified via HMAC-SHA256)

#### Request Headers
```http
Content-Type: application/json
Client-Id: 00000000
Request-Id: REQ-001
Request-Timestamp: 2026-10-26T14:30:00Z
Signature: HMACSHA256=abcdef123456...
```

#### Request Body (DOKU Settlement Format)
```json
{
  "service": { "id": "QRIS" },
  "transaction": {
    "status": "SUCCESS",
    "date": "2026-10-26T14:30:00Z",
    "original_request_id": "REQ-001"
  },
  "order": {
    "invoice_number": "GYM-1719398400000-d3b07384",
    "amount": 29000
  }
}
```

#### Processing Workflow
1. Extracts `Client-Id`, `Request-Id`, `Request-Timestamp`, and `Signature` from headers.
2. Generates canonical string:
   ```text
   Client-Id:Request-Id:Request-Timestamp:Request-Target:Digest
   ```
3. Compares incoming signature with calculated HMAC using `crypto.timingSafeEqual`.
4. If signature matches and status is `"SUCCESS"`:
   - Queries `payment_requests` for matching `invoice_number`.
   - Executes atomic RPC `approve_payment_request(request_id)`.
   - Forwards real-time settlement notification to Super-Admin Telegram bot.
5. Returns `200 OK` acknowledge to DOKU.

#### Success Response (`200 OK`)
```json
{
  "status": "SUCCESS",
  "message": "Payment verified and credited successfully."
}
```

#### Error Response (`401 Unauthorized`)
```json
{
  "status": "FAILED",
  "message": "Invalid HMAC signature."
}
```

---

### 2.3. `POST /api/telegram-webhook`
Receives webhook callbacks from Telegram Bot Platform for SaaS administrative operations.

- **Access Level:** Telegram Bot API (Validated via `X-Telegram-Bot-Api-Secret-Token`)

#### Supported Admin Commands
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/stats` | None | Returns total registered users, active workouts today, and gross revenue. |
| `/growth` | None | Displays 7-day user acquisition and workout completion trajectory. |
| `/recent` | None | Lists last 5 completed workout sessions across platform. |
| `/check` | `<email>` | Inspects athlete profile, subscription expiry, and volume statistics. |
| `/grant` | `<email> <days>` | Manually extends athlete Pro status by designated days. |
| `/revoke` | `<email>` | Revokes Pro access and resets role to regular athlete. |
| `/broadcast` | `<message>` | Sends global in-app notification to all registered users. |
| `/clearnotif`| None | Clears system notification queue. |

#### Inline Callback Queries
- `acc:<request_id>`: Approves pending payment request directly from Telegram notification card.
- `rej:<request_id>`: Rejects invalid or fraudulent payment proof.

---

### 2.4. `POST /api/analyze-nutrition`
Processes food images captured via camera or gallery and extracts calories and macronutrient estimates using Google Gemini 3.7 Vision API.

- **Access Level:** Authenticated User
- **Payload Constraint:** Base64 image payload capped at 5 MB (OWASP API4 protection).

#### Request Body
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "preferredLanguage": "id"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "food": "Dada Ayam Panggang & Nasi Merah",
  "calories": 420,
  "protein": 42.5,
  "carbs": 48.0,
  "fat": 6.2,
  "confidenceScore": 0.94,
  "description": "Portion approx 150g grilled chicken breast with 100g cooked brown rice."
}
```

---

### 2.5. `POST /api/generate-routine`
Generates personalized training routines dynamically matched to available home equipment or gym setups.

#### Request Body
```json
{
  "level": "intermediate",
  "focus": "hypertrophy",
  "targetMuscles": ["chest", "triceps", "shoulders"],
  "availableEquipment": ["dumbbells", "bench"],
  "cnsScore": 4
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "routineName": "Upper Body Push (Home Dumbbell Focus)",
  "exercises": [
    {
      "name": "Flat Dumbbell Press",
      "targetSets": 4,
      "targetReps": "8-10",
      "restSeconds": 120,
      "tempo": "3-0-1-0",
      "cues": "Retraksi skapula, kontrol 3 detik fase eksentrik."
    }
  ]
}
```
