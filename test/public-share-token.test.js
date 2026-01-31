const test = require('node:test');
const assert = require('node:assert/strict');

const { isPublicShareToken } = require('../insforge-src/shared/public-view');

test('isPublicShareToken accepts 64-hex tokens', () => {
  const token = 'a'.repeat(64);
  assert.equal(isPublicShareToken(token), true);
});

test('isPublicShareToken rejects uppercase 64-hex tokens', () => {
  const token = 'A'.repeat(64);
  assert.equal(isPublicShareToken(token), false);
});

test('isPublicShareToken rejects jwt-like tokens', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
  assert.equal(isPublicShareToken(token), false);
});

test('isPublicShareToken rejects non-hex or wrong-length tokens', () => {
  assert.equal(isPublicShareToken('g'.repeat(64)), false);
  assert.equal(isPublicShareToken('a'.repeat(63)), false);
  assert.equal(isPublicShareToken('a'.repeat(65)), false);
});
