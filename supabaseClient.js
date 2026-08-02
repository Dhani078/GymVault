import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sjrzhiigrcrcpgvnfixo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QkDfIJZOVzZsO39jEdpI5w_fb4Bkavp';

// Use AsyncStorage on mobile, localStorage on web
let storage = undefined;
try {
  if (Platform.OS !== 'web') {
    storage = require('@react-native-async-storage/async-storage').default;
  }
} catch (e) {
  // AsyncStorage not available, fallback to default
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auto refresh token when app comes to foreground
const subscription = AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// ─── Database Bootstrap ───
// Checks if required tables exist and shows setup instructions if not.
let _dbReady = null; // cached result

export async function ensureDatabase() {
  if (_dbReady !== null) return _dbReady;

  try {
    // Quick probe: try to select from workout_sessions
    const { error } = await supabase.from('workout_sessions').select('id').limit(1);
    if (error && error.message.includes('does not exist')) {
      console.error(
        '⚠️  DATABASE NOT SET UP!\n' +
        'Please run setup_database.sql in Supabase SQL Editor.\n' +
        'Open: https://supabase.com/dashboard → SQL Editor → paste setup_database.sql → Run'
      );
      _dbReady = false;
      return false;
    }
    _dbReady = true;
    return true;
  } catch (e) {
    _dbReady = false;
    return false;
  }
}

// ─── Safe Query Helpers ───
// Wraps all DB operations in try/catch with user-friendly error handling.

/**
 * Safe SELECT query. Returns { data, error }.
 * Always filters by user_id when provided.
 */
export async function safeSelect(table, { columns = '*', filters = {}, order = null, limit = null, single = false } = {}) {
  try {
    let query = supabase.from(table).select(columns);

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    if (order) query = query.order(order.column, { ascending: order.ascending ?? false });
    if (limit) query = query.limit(limit);
    if (single) query = query.single();

    const { data, error } = await query;
    if (error) {
      console.warn(`[DB SELECT ${table}]`, error.message);
      return { data: single ? null : [], error };
    }
    return { data: data || (single ? null : []), error: null };
  } catch (e) {
    console.warn(`[DB SELECT ${table}] Exception:`, e.message);
    return { data: single ? null : [], error: e };
  }
}

/**
 * Safe INSERT. Returns { data, error }.
 */
export async function safeInsert(table, payload, { returnData = true } = {}) {
  try {
    let query = supabase.from(table).insert(payload);
    if (returnData) query = query.select().single();

    const { data, error } = await query;
    if (error) {
      console.warn(`[DB INSERT ${table}]`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (e) {
    console.warn(`[DB INSERT ${table}] Exception:`, e.message);
    return { data: null, error: e };
  }
}

/**
 * Safe UPSERT. Returns { data, error }.
 */
export async function safeUpsert(table, payload, { onConflict = 'id' } = {}) {
  try {
    const { data, error } = await supabase
      .from(table)
      .upsert(payload, { onConflict })
      .select()
      .single();

    if (error) {
      console.warn(`[DB UPSERT ${table}]`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (e) {
    console.warn(`[DB UPSERT ${table}] Exception:`, e.message);
    return { data: null, error: e };
  }
}

/**
 * Safe batch INSERT (no return data, for sets etc).
 */
export async function safeBatchInsert(table, rows) {
  if (!rows || rows.length === 0) return { error: null };
  try {
    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      console.warn(`[DB BATCH INSERT ${table}]`, error.message);
      return { error };
    }
    return { error: null };
  } catch (e) {
    console.warn(`[DB BATCH INSERT ${table}] Exception:`, e.message);
    return { error: e };
  }
}
