# GymVault Production Deployment & Operations Manual

> Standard Operating Procedure (SOP) for deploying, updating, and operating GymVault across Web (Vercel) and Mobile (Expo EAS).  
> Author: Dhani078  
> Version: 2.4.0

---

## 1. Environment Configuration Matrix

The application demands the following environment variables across Vercel production settings and local mobile `.env` files:

| Variable Name | Environment | Sensitivity | Description |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_SUPABASE_URL` | Client / Web | Public | Supabase project REST API endpoint URL. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Client / Web | Public | Supabase public anonymous client key. |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Client / Web | High | Google Gemini API key for client-side waterfall. |
| `DOKU_CLIENT_ID` | Serverless Edge | High | Merchant Client ID issued by DOKU Dashboard. |
| `DOKU_SECRET_KEY` | Serverless Edge | Critical | Merchant Secret Key for HMAC-SHA256 signing. |
| `DOKU_API_KEY` | Serverless Edge | High | General API access key for DOKU payment engine. |
| `DOKU_API_HOST` | Serverless Edge | Public | API host URL (`https://api.doku.com`). |
| `TELEGRAM_BOT_TOKEN` | Serverless Edge | High | Telegram BotFather API token for SaaS notifications. |
| `TELEGRAM_ADMIN_CHAT_ID` | Serverless Edge | High | Telegram Chat ID of system administrator. |
| `TELEGRAM_SECRET_TOKEN` | Serverless Edge | High | Pre-shared secret token for Telegram webhook validation. |
| `PAYMENT_WEBHOOK_SECRET` | Serverless Edge | High | Shared secret for secondary payment callbacks. |

---

## 2. Automated Test & Pre-Flight Gate

Before initiating any deployment, run the automated verification test suite:

```bash
# 1. Run full unit test suite (65 assertions)
npm test

# 2. Run JavaScript syntax linter across all files
python -c "
import os, subprocess
gym_dir = '.'
for root, dirs, files in os.walk(gym_dir):
    if any(x in root for x in ['node_modules', '.git', 'dist', '.expo']): continue
    for f in files:
        if f.endswith('.js'):
            res = subprocess.run(['node', '-c', os.path.join(root, f)], capture_output=True)
            if res.returncode != 0: raise SystemExit(f'Syntax error in {f}')
print('All JS files passed syntax validation!')
"
```

---

## 3. Web Deployment (Vercel)

GymVault deploys to Vercel as a hybrid application: static Expo web bundle served at the root with serverless edge functions under `/api`:

### Step 1: Export Static Web Bundle
```bash
npx expo export -p web
```
This compiles assets into the local `dist/` directory.

### Step 2: Push to Git Remote
Deployments trigger automatically upon push to the `main` branch of `https://github.com/Dhani078/GymVault.git`:
```bash
git add -A
git commit -m "feat/fix: description of update"
git push origin main
```

### Step 3: Verify Live Production via Headless Chrome CDP
Execute the automated visual regression script against the live production URL:
```bash
AUDIT_URL="https://gymvault-app.vercel.app" node scripts/audit-chrome.mjs
```
Confirm output indicates:
- `[Mobile Standard (390x844)] Overflow: ZERO`
- `[Mobile Compact (320x568)] Overflow: ZERO`
- `[Desktop Standard (1280x800)] Overflow: ZERO`
- `Uncaught JS Exceptions (0)`

---

## 4. Mobile Native Build (Expo EAS)

For distribution to Google Play Store and Apple App Store:

### 1. Build Android Package (AAB / APK)
```bash
# Production Android App Bundle (Google Play)
eas build --platform android --profile production

# Standalone Test APK (Direct Installation)
eas build --platform android --profile preview
```

### 2. Build iOS Archive (IPA)
```bash
eas build --platform ios --profile production
```

---

## 5. Rollback & Disaster Recovery SOP

In the event of an unpredicted production regression:

1. Vercel Instant Rollback:
   - Navigate to Vercel Project Dashboard ➔ Deployments.
   - Locate the previous stable deployment hash and select Instant Rollback.
2. Git Branch Revert:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. Database Migration Safety:
   - All database migrations are written forward-only with backward compatibility for existing client versions. Column drops must follow a 2-stage deprecation cycle.
