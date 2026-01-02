#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const RPC_ROWS = [
  {
    source: 'codex',
    model: 'gpt-5.2-codex',
    total_tokens: '20',
    input_tokens: '7',
    cached_input_tokens: '1',
    output_tokens: '13',
    reasoning_output_tokens: '0'
  }
];

class DatabaseStub {
  constructor({ rpcRows }) {
    this.rpcRows = rpcRows;
    this._table = null;
  }

  async rpc(fnName, params) {
    assert.equal(fnName, 'vibescore_usage_summary_agg');
    assert.deepEqual(params, {
      p_from: '2025-12-01T00:00:00.000Z',
      p_to: '2025-12-03T00:00:00.000Z',
      p_source: null,
      p_model: null
    });
    return { data: this.rpcRows, error: null };
  }

  from(table) {
    this._table = table;
    return this;
  }
  select() { return this; }
  eq() { return this; }
  gte() { return this; }
  lte() { return this; }
  lt() { return this; }
  or() { return this; }
  order() { return this; }
  limit() { return { data: [], error: null }; }
}

function createClientStub() {
  return {
    auth: { async getCurrentUser() { return { data: { user: { id: 'user-id' } }, error: null }; } },
    database: new DatabaseStub({ rpcRows: RPC_ROWS })
  };
}

async function main() {
  process.env.INSFORGE_INTERNAL_URL = 'http://insforge:7130';
  process.env.INSFORGE_ANON_KEY = 'anon';
  global.Deno = { env: { get: (k) => process.env[k] || null } };
  global.createClient = createClientStub;

  const usageSummary = require('../../insforge-src/functions/vibescore-usage-summary.js');
  const res = await usageSummary(new Request(
    'http://local/functions/vibescore-usage-summary?from=2025-12-01&to=2025-12-02&tz=UTC',
    { method: 'GET', headers: { Authorization: 'Bearer user-jwt' } }
  ));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.totals.total_tokens, '20');
  assert.equal(body.totals.input_tokens, '7');
  assert.equal(body.totals.cached_input_tokens, '1');
  assert.equal(body.totals.output_tokens, '13');
  assert.equal(body.totals.reasoning_output_tokens, '0');
  process.stdout.write(JSON.stringify({ ok: true }) + '\n');
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
