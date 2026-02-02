'use strict';

const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const modulePath = path.join(
  __dirname,
  '..',
  'scripts',
  'ops',
  'insforge2-smoke-project-usage-summary.cjs'
);

let smokeModule = null;
let loadError = null;
try {
  smokeModule = require(modulePath);
} catch (err) {
  loadError = err;
}

test('insforge2 smoke script exports runSmoke', () => {
  assert.ok(smokeModule && typeof smokeModule.runSmoke === 'function', loadError?.message);
});

test('buildRequestUrl uses baseUrl and limit', () => {
  if (!smokeModule) return;
  const url = smokeModule.buildRequestUrl({ baseUrl: 'https://example.com', limit: 3 });
  assert.equal(
    url,
    'https://example.com/functions/vibeusage-project-usage-summary?limit=3'
  );
});

test('runSmoke returns ok=false on non-200', async () => {
  if (!smokeModule) return;
  const fetchImpl = async () => ({
    ok: false,
    status: 500,
    async json() {
      return { error: 'boom' };
    },
    async text() {
      return 'boom';
    }
  });
  const res = await smokeModule.runSmoke({
    baseUrl: 'https://example.com',
    token: 'token',
    limit: 3,
    fetchImpl,
    logger: { info() {}, error() {} }
  });
  assert.equal(res.ok, false);
  assert.equal(res.status, 500);
});

test('runSmoke returns ok=true on 200 with entries', async () => {
  if (!smokeModule) return;
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { entries: [] };
    },
    async text() {
      return '';
    }
  });
  const res = await smokeModule.runSmoke({
    baseUrl: 'https://example.com',
    token: 'token',
    limit: 3,
    fetchImpl,
    logger: { info() {}, error() {} }
  });
  assert.equal(res.ok, true);
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(res.entries), true);
});
