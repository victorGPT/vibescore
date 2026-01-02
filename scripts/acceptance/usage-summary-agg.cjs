#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const HOURLY_ROWS = [
  {
    hour_start: '2025-12-01T06:00:00.000Z',
    source: 'alpha',
    model: 'gpt-5.2-codex',
    total_tokens: '120',
    input_tokens: '40',
    cached_input_tokens: '10',
    output_tokens: '70',
    reasoning_output_tokens: '5'
  },
  {
    hour_start: '2025-12-01T18:00:00.000Z',
    source: 'alpha',
    model: 'gpt-5.2-codex',
    total_tokens: '80',
    input_tokens: '30',
    cached_input_tokens: '5',
    output_tokens: '45',
    reasoning_output_tokens: '0'
  },
  {
    hour_start: '2025-12-02T09:00:00.000Z',
    source: 'beta',
    model: 'gpt-5.2-codex',
    total_tokens: '200',
    input_tokens: '90',
    cached_input_tokens: '20',
    output_tokens: '90',
    reasoning_output_tokens: '0'
  }
];

function toBigInt(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.max(0, Math.trunc(value)));
  if (typeof value === 'string' && /^[0-9]+$/.test(value)) return BigInt(value);
  return 0n;
}

function aggregateRows(rows) {
  const map = new Map();
  for (const row of rows) {
    const source = row?.source || 'codex';
    const model = row?.model || null;
    const key = `${source}::${model || ''}`;
    if (!map.has(key)) {
      map.set(key, {
        source,
        model,
        total_tokens: 0n,
        input_tokens: 0n,
        cached_input_tokens: 0n,
        output_tokens: 0n,
        reasoning_output_tokens: 0n
      });
    }
    const bucket = map.get(key);
    bucket.total_tokens += toBigInt(row?.total_tokens);
    bucket.input_tokens += toBigInt(row?.input_tokens);
    bucket.cached_input_tokens += toBigInt(row?.cached_input_tokens);
    bucket.output_tokens += toBigInt(row?.output_tokens);
    bucket.reasoning_output_tokens += toBigInt(row?.reasoning_output_tokens);
  }
  return Array.from(map.values()).map((entry) => ({
    source: entry.source,
    model: entry.model,
    total_tokens: entry.total_tokens.toString(),
    input_tokens: entry.input_tokens.toString(),
    cached_input_tokens: entry.cached_input_tokens.toString(),
    output_tokens: entry.output_tokens.toString(),
    reasoning_output_tokens: entry.reasoning_output_tokens.toString()
  }));
}

function sumTotals(rows) {
  return rows.reduce(
    (acc, row) => ({
      total_tokens: acc.total_tokens + toBigInt(row?.total_tokens),
      input_tokens: acc.input_tokens + toBigInt(row?.input_tokens),
      cached_input_tokens: acc.cached_input_tokens + toBigInt(row?.cached_input_tokens),
      output_tokens: acc.output_tokens + toBigInt(row?.output_tokens),
      reasoning_output_tokens: acc.reasoning_output_tokens + toBigInt(row?.reasoning_output_tokens)
    }),
    {
      total_tokens: 0n,
      input_tokens: 0n,
      cached_input_tokens: 0n,
      output_tokens: 0n,
      reasoning_output_tokens: 0n
    }
  );
}

const RPC_ROWS = aggregateRows(HOURLY_ROWS);

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

  select() {
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

  order() {
    return this;
  }

  limit() {
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

async function main() {
  process.env.INSFORGE_INTERNAL_URL = 'http://insforge:7130';
  process.env.INSFORGE_ANON_KEY = 'anon';
  global.Deno = { env: { get: (k) => process.env[k] || null } };
  global.createClient = () => createClientStub(new DatabaseStub({ rpcRows: RPC_ROWS }));

  const usageSummary = require('../../insforge-src/functions/vibescore-usage-summary.js');
  const res = await usageSummary(
    new Request('http://local/functions/vibescore-usage-summary?from=2025-12-01&to=2025-12-02', {
      method: 'GET',
      headers: { Authorization: 'Bearer user-jwt' }
    })
  );
  const body = await res.json();

  const scanTotals = sumTotals(HOURLY_ROWS);

  assert.equal(res.status, 200);
  assert.equal(body.days, 2);
  assert.equal(body.totals.total_tokens, scanTotals.total_tokens.toString());
  assert.equal(body.totals.input_tokens, scanTotals.input_tokens.toString());
  assert.equal(body.totals.cached_input_tokens, scanTotals.cached_input_tokens.toString());
  assert.equal(body.totals.output_tokens, scanTotals.output_tokens.toString());
  assert.equal(body.totals.reasoning_output_tokens, scanTotals.reasoning_output_tokens.toString());

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        rpc_rows: RPC_ROWS.length,
        totals: body.totals
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
