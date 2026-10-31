# Security Policy

## Supported Versions

GymVault actively supports and maintains security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.5.x   | :white_check_mark: |
| 2.4.x   | :white_check_mark: |
| < 2.4   | :x:                |

## Reporting a Vulnerability

The GymVault team takes application security seriously. If you discover a vulnerability or potential security flaw:

1. **Do not create public GitHub issues** for security disclosures.
2. Email your findings directly to:
   - **Lead Maintainer**: `dhanisepeda@gmail.com`
   - **Security Team**: `security@gymvault.id`
3. Include detailed steps to reproduce the vulnerability, including payload examples and expected vs actual behavior.
4. You will receive an initial response acknowledging your report within 24–48 hours.
5. We will coordinate a patch release and credit your discovery in our security changelog once the fix is deployed.

## Security Guarantees & Architecture

- **Timing-Safe Cryptography**: Webhook signatures from payment providers (DOKU QRIS) are strictly verified using `crypto.timingSafeEqual` over SHA-256 HMAC digests to eliminate timing attacks.
- **Row Level Security (RLS)**: Every Supabase PostgreSQL table enforces strict tenant-isolation policies preventing cross-user data leakage.
- **Client Bundle Isolation**: Secret keys (`DOKU_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are restricted to serverless edge runtime (`/api/`) and are never bundled into client JavaScript.
- **Rate Limiting**: Public endpoints enforce sliding-window IP rate limiting to prevent denial-of-service and invoice flooding.
