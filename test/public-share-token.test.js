const test = require('node:test');
const assert = require('node:assert/strict');

const { isPublicShareToken } = require('../insforge-src/shared/public-view');

test('isPublicShareToken accepts pv1 user tokens', () => {
  const token = 'pv1-11111111-2222-3333-4444-555555555555';
  assert.equal(isPublicShareToken(token), true);
});

test('isPublicShareToken rejects uppercase pv1 user tokens', () => {
  const token = 'PV1-11111111-2222-3333-4444-555555555555';
  assert.equal(isPublicShareToken(token), false);
});

test('isPublicShareToken rejects legacy 64-hex tokens', () => {
  const token = 'a'.repeat(64);
  assert.equal(isPublicShareToken(token), false);
});

test('isPublicShareToken rejects jwt-like tokens', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
  assert.equal(isPublicShareToken(token), false);
});

test('isPublicShareToken rejects malformed pv1 user tokens', () => {
  assert.equal(isPublicShareToken('pv1-11111111-2222-3333-4444-55555555555z'), false);
  assert.equal(isPublicShareToken('pv1-11111111-2222-3333-4444-5555555555556'), false);
});

test('isPublicShareToken rejects non-hex and wrong-length legacy tokens', () => {
  assert.equal(isPublicShareToken('g'.repeat(64)), false);
  assert.equal(isPublicShareToken('a'.repeat(63)), false);
  assert.equal(isPublicShareToken('a'.repeat(65)), false);
});
