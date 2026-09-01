import * as Crypto from 'expo-crypto';

/**
 * Shared UUID v4 generator — satu sumber kebenaran untuk seluruh app.
 * Gunakan ini, jangan buat ulang di tiap file.
 */
export function makeId() {
  return Crypto.randomUUID();
}
