#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const { getDefaultPricingProfile, resolvePricingProfile } = require('../../insforge-src/shared/pricing');

class DatabaseStub {
  constructor(rows = []) {
    this.rows = rows;
    this._table = null;
    this.orCalls = 0;
    this.lastOr = null;
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

  lte() {
    return this;
  }

  or(filter) {
    this.orCalls += 1;
    this.lastOr = filter;
    return this;
  }

  order() {
    return this;
  }

  limit() {
    if (this._table === 'vibeusage_pricing_model_aliases') {
      return { data: [], error: null };
    }
    return { data: this.rows, error: null };
  }
}

async function main() {
  const profileRow = {
    model: 'openai/codex-vision',
    source: 'openrouter',
    effective_from: '2025-11-30',
    input_rate_micro_per_million: 999000,
    cached_input_rate_micro_per_million: 111000,
    output_rate_micro_per_million: 2220000,
    reasoning_output_rate_micro_per_million: 3330000
  };

  const edgeClient = { database: new DatabaseStub([profileRow]) };
  const resolved = await resolvePricingProfile({
    edgeClient,
    effectiveDate: '2025-12-25',
    model: 'codex-vision'
  });

  assert.equal(resolved.model, profileRow.model);
  assert.equal(resolved.source, profileRow.source);
  assert.equal(resolved.effective_from, profileRow.effective_from);
  assert.equal(resolved.rates_micro_per_million.input, profileRow.input_rate_micro_per_million);
  assert.equal(
    resolved.rates_micro_per_million.cached_input,
    profileRow.cached_input_rate_micro_per_million
  );
  assert.equal(
    resolved.rates_micro_per_million.output,
    profileRow.output_rate_micro_per_million
  );
  assert.equal(
    resolved.rates_micro_per_million.reasoning_output,
    profileRow.reasoning_output_rate_micro_per_million
  );
  assert.equal(edgeClient.database.orCalls, 1);
  assert.ok(edgeClient.database.lastOr && edgeClient.database.lastOr.includes('model.eq.codex-vision'));

  const fallbackClient = { database: new DatabaseStub([]) };
  const fallback = await resolvePricingProfile({ edgeClient: fallbackClient, effectiveDate: '2025-12-25' });
  const defaultProfile = getDefaultPricingProfile();

  assert.deepEqual(fallback, defaultProfile);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        resolved_model: resolved.model,
        fallback_model: fallback.model
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
