'use strict';

const assert = require('node:assert/strict');
const { buildUpdates, BILLABLE_RULE_VERSION } = require('../scripts/ops/billable-total-tokens-backfill.cjs');

const rows = [
  {
    user_id: 'u1',
    device_id: 'd1',
    source: 'codex',
    model: 'm1',
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 2,
    output_tokens: 3,
    reasoning_output_tokens: 0,
    total_tokens: 6
  }
];

const updates = buildUpdates(rows);
assert.equal(updates.length, 1);
assert.equal(updates[0].billable_total_tokens, '4');
assert.equal(updates[0].billable_rule_version, BILLABLE_RULE_VERSION);

const skipped = buildUpdates([{ ...rows[0], billable_total_tokens: '4' }]);
assert.equal(skipped.length, 0);
