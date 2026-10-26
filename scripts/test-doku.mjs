import assert from 'node:assert';
import { generateDokuHeaders, verifyDokuNotification } from '../services/dokuService.js';

console.log('🧪 [Test Suite: DOKU QRIS Engine Verification]');

// Test 1: Header generation
process.env.DOKU_CLIENT_ID = 'MOCK-CLIENT-123';
process.env.DOKU_SECRET_KEY = 'SK-MOCK-SECRET-KEY-456';

const targetPath = '/checkout/v1/payment';
const sampleBody = JSON.stringify({
  order: { amount: 29900, invoice_number: 'INV-TEST-001' }
});

const headers = generateDokuHeaders(targetPath, sampleBody);

assert.strictEqual(headers['Client-Id'], 'MOCK-CLIENT-123', 'Client-Id must match');
assert.ok(headers['Request-Id'], 'Request-Id must exist');
assert.ok(headers['Request-Timestamp'].endsWith('Z'), 'Timestamp must be ISO with Z');
assert.ok(headers['Signature'].startsWith('HMACSHA256='), 'Signature must start with HMACSHA256=');
console.log('  ✔ PASS: DOKU Header & HMAC-SHA256 Generator matches specification');

// Test 2: Notification signature verification (Positive)
const validVerification = verifyDokuNotification({
  clientId: headers['Client-Id'],
  requestId: headers['Request-Id'],
  requestTimestamp: headers['Request-Timestamp'],
  signature: headers['Signature'],
  body: sampleBody,
  targetPath
});
assert.strictEqual(validVerification, true, 'Valid signature must verify as true');
console.log('  ✔ PASS: verifyDokuNotification returns TRUE for legitimate signature');

// Test 3: Notification signature verification (Tampered Body)
const tamperedBody = JSON.stringify({
  order: { amount: 999999, invoice_number: 'INV-TEST-001' }
});
const tamperedVerification = verifyDokuNotification({
  clientId: headers['Client-Id'],
  requestId: headers['Request-Id'],
  requestTimestamp: headers['Request-Timestamp'],
  signature: headers['Signature'],
  body: tamperedBody,
  targetPath
});
assert.strictEqual(tamperedVerification, false, 'Tampered body must fail verification');
console.log('  ✔ PASS: verifyDokuNotification returns FALSE on tampered body (Anti-Spoofing)');

// Test 4: Notification signature verification (Invalid Signature)
const invalidSigVerification = verifyDokuNotification({
  clientId: headers['Client-Id'],
  requestId: headers['Request-Id'],
  requestTimestamp: headers['Request-Timestamp'],
  signature: 'HMACSHA256=fake_signature_abc_123',
  body: sampleBody,
  targetPath
});
assert.strictEqual(invalidSigVerification, false, 'Invalid signature must fail');
console.log('  ✔ PASS: verifyDokuNotification returns FALSE on forged signature');

console.log('🎉 ALL DOKU QRIS TESTS PASSED!');
