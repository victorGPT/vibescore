#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const {
  computeUsageCost,
  formatUsdFromMicros,
  getDefaultPricingProfile
} = require('../../insforge-src/shared/pricing');

const HOURLY_ROWS = [
  {
    hour_start: '2025-12-01T18:00:00.000Z',
    source: 'alpha',
    model: 'gpt-5.2-codex',
    total_tokens: '300',
    input_tokens: '100',
    cached_input_tokens: '50',
    output_tokens: '200',
    reasoning_output_tokens: '20'
  },
  {
    hour_start: '2025-12-02T18:00:00.000Z',
    source: 'beta',
    model: 'gpt-5.2-codex',
    total_tokens: '220',
    input_tokens: '100',
    cached_input_tokens: '10',
    output_tokens: '100',
    reasoning_output_tokens: '10'
  }
];

const RPC_ROWS = HOURLY_ROWS.map((row) => ({
  source: row.source,
  model: row.model,
  total_tokens: row.total_tokens,
  input_tokens: row.input_tokens,
  cached_input_tokens: row.cached_input_tokens,
  output_tokens: row.output_tokens,
  reasoning_output_tokens: row.reasoning_output_tokens
}));

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
    if (this._table === 'vibescore_pricing_model_aliases') {
      return { data: [], error: null };
    }
    if (this._table === 'vibescore_pricing_profiles') {
      return { data: [buildPricingRow()], error: null };
    }
    return { data: [], error: null };
  }
}

function buildPricingRow() {
  const profile = getDefaultPricingProfile();
  return {
    model: profile.model,
    source: profile.source,
    effective_from: profile.effective_from,
    input_rate_micro_per_million: profile.rates_micro_per_million.input,
    cached_input_rate_micro_per_million: profile.rates_micro_per_million.cached_input,
    output_rate_micro_per_million: profile.rates_micro_per_million.output,
    reasoning_output_rate_micro_per_million: profile.rates_micro_per_million.reasoning_output
  };
}

function createClientStub() {
  return {
    auth: {
      async getCurrentUser() {
        return { data: { user: { id: 'user-id' } }, error: null };
      }
    },
    database: new DatabaseStub({ rpcRows: RPC_ROWS })
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

  global.createClient = createClientStub;

  const usageSummary = require('../../insforge-src/functions/vibescore-usage-summary.js');

  const query = 'from=2025-12-01&to=2025-12-02';
  const res = await usageSummary(
    new Request(`http://local/functions/vibescore-usage-summary?${query}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer user-jwt' }
    })
  );

  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.days, 2);
  assert.equal(body.totals.total_tokens, '520');
  assert.equal(body.totals.input_tokens, '200');
  assert.equal(body.totals.cached_input_tokens, '60');
  assert.equal(body.totals.output_tokens, '300');
  assert.equal(body.totals.reasoning_output_tokens, '30');
  assert.equal(body.pricing.pricing_mode, 'mixed');
  const expectedCost = formatUsdFromMicros(
    computeUsageCost(
      {
        total_tokens: HOURLY_ROWS[0].total_tokens,
        input_tokens: HOURLY_ROWS[0].input_tokens,
        cached_input_tokens: HOURLY_ROWS[0].cached_input_tokens,
        output_tokens: HOURLY_ROWS[0].output_tokens,
        reasoning_output_tokens: HOURLY_ROWS[0].reasoning_output_tokens
      },
      getDefaultPricingProfile()
    ).cost_micros +
      computeUsageCost(
        {
          total_tokens: HOURLY_ROWS[1].total_tokens,
          input_tokens: HOURLY_ROWS[1].input_tokens,
          cached_input_tokens: HOURLY_ROWS[1].cached_input_tokens,
          output_tokens: HOURLY_ROWS[1].output_tokens,
          reasoning_output_tokens: HOURLY_ROWS[1].reasoning_output_tokens
        },
        getDefaultPricingProfile()
      ).cost_micros
  );
  assert.equal(body.totals.total_cost_usd, expectedCost);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
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
