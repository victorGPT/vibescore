#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const RPC_ROWS = [
  {
    source: 'codex',
    model: 'gpt-5.2-codex',
    total_tokens: '1007',
    input_tokens: '1001',
    cached_input_tokens: '0',
    output_tokens: '0',
    reasoning_output_tokens: '0'
  }
];

class DatabaseStub {
  constructor({ calls }) {
    this.calls = calls;
    this._table = null;
    this._select = null;
  }

  async rpc(fnName, params) {
    this.calls.rpc = { fnName, params };
    return { data: RPC_ROWS, error: null };
  }

  from(table) {
    this._table = table;
    this._select = null;
    return this;
  }

  select(columns) {
    this._select = columns;
    return this;
  }

  eq() {
    return this;
  }

  or() {
    return this;
  }

  lte() {
    return this;
  }

  gte() {
    return this;
  }

  lt() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    if (this._table === 'vibescore_pricing_model_aliases') {
      return { data: [], error: null };
    }
    if (this._table === 'vibescore_pricing_profiles') {
      return { data: [buildPricingRow()], error: null };
    }
    return { data: [], error: null };
  }
}

function createClientStub(database) {
  return {
    auth: {
      async getCurrentUser() {
        return { data: { user: { id: 'user-id' } }, error: null };
      }
    },
    database
  };
}

function buildPricingRow() {
  return {
    model: 'gpt-5.2-codex',
    source: 'openrouter',
    effective_from: '2025-12-23',
    input_rate_micro_per_million: 1750000,
    cached_input_rate_micro_per_million: 175000,
    output_rate_micro_per_million: 14000000,
    reasoning_output_rate_micro_per_million: 14000000
  };
}

async function main() {
  process.env.INSFORGE_INTERNAL_URL = 'http://insforge:7130';
  process.env.INSFORGE_ANON_KEY = 'anon';
  process.env.INSFORGE_SERVICE_ROLE_KEY = '';

  global.Deno = {
    env: {
      get(key) {
        const v = process.env[key];
        return v == null || v === '' ? null : v;
      }
    }
  };

  const calls = { rpc: null };
  global.createClient = () => createClientStub(new DatabaseStub({ calls }));

  const usageSummary = require('../../insforge-src/functions/vibescore-usage-summary.js');
  const query = 'from=2025-12-01&to=2025-12-02&tz_offset_minutes=-480';

  const res = await usageSummary(
    new Request(`http://local/functions/vibescore-usage-summary?${query}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer user-jwt' }
    })
  );

  const body = await res.json();

  assert.equal(res.status, 200);
  assert.ok(calls.rpc, 'expected rpc call');
  assert.equal(calls.rpc.fnName, 'vibescore_usage_summary_agg');
  assert.deepEqual(calls.rpc.params, {
    p_from: '2025-12-01T08:00:00.000Z',
    p_to: '2025-12-03T08:00:00.000Z',
    p_source: null,
    p_model: null
  });
  assert.equal(body.days, 2);
  assert.equal(body.totals.total_tokens, '1007');
  assert.equal(body.totals.input_tokens, '1001');
  assert.equal(body.totals.cached_input_tokens, '0');
  assert.equal(body.totals.output_tokens, '0');
  assert.equal(body.totals.reasoning_output_tokens, '0');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        rpc: calls.rpc,
        totals: body.totals,
        days: body.days
      },
      null,
      2
    ) + '\n'
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
