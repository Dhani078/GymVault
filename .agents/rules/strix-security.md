# STRIX: Automated Security, Pentesting & Resilience Rule

When developing, reviewing, or modifying any feature:
1. **Zero Trust & RLS First**: Never trust client-side data. Enforce Supabase Row Level Security (RLS) on all database tables. Never allow bypass without admin claim verification (`auth.jwt() ->> 'role' = 'admin'`).
2. **Input Validation & Sanitization**: Protect all queries and dynamic parameters against SQLi, XSS, and parameter injection.
3. **Secret & Key Protection**: Never commit or expose `SUPABASE_SERVICE_ROLE_KEY`, private tokens, or backend credentials to client bundles or public repositories.
4. **Authorization & IDOR Defense**: Validate that `auth.uid() = user_id` on every mutation (Insert, Update, Delete) and sensitive read operation.
5. **Continuous Threat Modeling**: Run Strix skills (`find-security-vulnerabilities-in-code`, `owasp-top-10-testing`, `api-security-testing`) before deployment.
