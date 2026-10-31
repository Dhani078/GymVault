/**
 * GymVault Supabase Database Diagnostic Healthcheck
 * Checks REST latency, RLS table accessibility, and connection status
 */

import fs from 'fs';
import path from 'path';

// Auto-load .env if available
let envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
let envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) {
        envKey = trimmed.split('=')[1]?.trim() || envKey;
      }
      if (trimmed.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) {
        envUrl = trimmed.split('=')[1]?.trim() || envUrl;
      }
    }
  }
} catch (_e) {}

const supabaseUrl = envUrl || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
const supabaseKey = envKey;

console.log('========================================');
console.log('🩺 GYMVAULT DATABASE HEALTHCHECK');
console.log('========================================');
console.log(`Target: ${supabaseUrl}`);

const tablesToCheck = ['exercises', 'workout_sessions', 'workout_sets', 'payment_requests', 'nutrition_logs', 'admin_logs'];

async function runHealthcheck() {
  const startTime = Date.now();
  let passedCount = 0;

  for (const table of tablesToCheck) {
    const tableStart = Date.now();
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count&limit=1`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Range': '0-0'
        }
      });

      const elapsed = Date.now() - tableStart;
      if (res.ok || res.status === 206 || res.status === 416) {
        console.log(`  ✔ [${table}] OK (${elapsed}ms)`);
        passedCount++;
      } else {
        console.log(`  ⚠ [${table}] HTTP ${res.status} ${res.statusText} (${elapsed}ms)`);
      }
    } catch (err) {
      console.log(`  ✖ [${table}] Network Error: ${err.message}`);
    }
  }

  const totalTime = Date.now() - startTime;
  console.log('========================================');
  console.log(`Diagnostic Complete: ${passedCount}/${tablesToCheck.length} tables verified in ${totalTime}ms`);
  console.log('========================================');
}

runHealthcheck().catch((err) => {
  console.error('Fatal healthcheck failure:', err);
  process.exit(1);
});
