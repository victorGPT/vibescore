#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const path = require('node:path');

const BASE_URL = 'http://insforge:7130';
const USER_ID = '11111111-2222-3333-4444-555555555555';
const USER_JWT = 'user_jwt_test';

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});

async function main() {
  setDenoEnv();

  const repoRoot = path.resolve(__dirname, '..', '..');
  const issueFn = require(path.join(repoRoot, 'insforge-functions', 'vibeusage-public-view-issue.js'));
  const revokeFn = require(path.join(repoRoot, 'insforge-functions', 'vibeusage-public-view-revoke.js'));
  const statusFn = require(path.join(repoRoot, 'insforge-functions', 'vibeusage-public-view-status.js'));

  const state = {
    row: null,
    upserts: 0,
    selects: 0,
    inserts: 0,
    updates: 0
  };

  globalThis.createClient = makeClient({ userId: USER_ID, userJwt: USER_JWT, state });

  const status0 = await callStatus(statusFn);
  assert.equal(status0.enabled, false);

  const issued = await callIssue(issueFn);
  assert.equal(issued.enabled, true);
  assert.ok(typeof issued.share_token === 'string' && issued.share_token.length > 0);

  const expectedHash = createHash('sha256').update(issued.share_token).digest('hex');
  assert.equal(state.row?.token_hash, expectedHash);
  assert.equal(state.row?.revoked_at, null);

  const status1 = await callStatus(statusFn);
  assert.equal(status1.enabled, true);

  const revoked = await callRevoke(revokeFn);
  assert.equal(revoked.enabled, false);
  assert.ok(typeof state.row?.revoked_at === 'string');

  const status2 = await callStatus(statusFn);
  assert.equal(status2.enabled, false);

  process.stdout.write('ok: public view issue/revoke/status flow\n');
}

function makeClient({ userId, userJwt, state }) {
  return ({ edgeFunctionToken }) => {
    assert.equal(edgeFunctionToken, userJwt);

    return {
      auth: {
        getCurrentUser: async () => ({ data: { user: { id: userId } }, error: null })
      },
      database: {
        from: (table) => {
          assert.equal(table, 'vibescore_public_views');

          return {
            upsert: async (rows, options) => {
              state.upserts += 1;
              assert.equal(options?.onConflict, 'user_id');
              state.row = rows?.[0] || null;
              return { error: null };
            },
            select: () => ({
              eq: (col, value) => {
                assert.equal(col, 'user_id');
                assert.equal(value, userId);
                return {
                  maybeSingle: async () => {
                    state.selects += 1;
                    return { data: state.row, error: null };
                  }
                };
              }
            }),
            insert: async (rows) => {
              state.inserts += 1;
              state.row = rows?.[0] || null;
              return { error: null };
            },
            update: (values) => ({
              eq: async (col, value) => {
                assert.equal(col, 'user_id');
                assert.equal(value, userId);
                state.updates += 1;
                state.row = { ...(state.row || { user_id: userId }), ...values, user_id: userId };
                return { error: null };
              }
            })
          };
        }
      }
    };
  };
}

async function callIssue(fn) {
  const req = new Request('http://localhost/functions/vibeusage-public-view-issue', {
    method: 'POST',
    headers: { Authorization: `Bearer ${USER_JWT}` }
  });

  const res = await fn(req);
  assert.equal(res.status, 200);
  return await res.json();
}

async function callRevoke(fn) {
  const req = new Request('http://localhost/functions/vibeusage-public-view-revoke', {
    method: 'POST',
    headers: { Authorization: `Bearer ${USER_JWT}` }
  });

  const res = await fn(req);
  assert.equal(res.status, 200);
  return await res.json();
}

async function callStatus(fn) {
  const req = new Request('http://localhost/functions/vibeusage-public-view-status', {
    method: 'GET',
    headers: { Authorization: `Bearer ${USER_JWT}` }
  });

  const res = await fn(req);
  assert.equal(res.status, 200);
  return await res.json();
}

function setDenoEnv() {
  globalThis.Deno = {
    env: {
      get(key) {
        if (key === 'INSFORGE_INTERNAL_URL') return BASE_URL;
        return undefined;
      }
    }
  };
}
