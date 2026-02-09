'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  buildUpdates,
  BILLABLE_RULE_VERSION,
  buildCursorFilter,
  runBackfill
} = require('../scripts/ops/project-billable-total-tokens-backfill.cjs');

const rows = [
  {
    user_id: 'u1',
    device_id: 'd1',
    source: 'codex',
    project_key: 'victorGPT/vibeusage',
    project_ref: 'repo:123',
    hour_start: '2025-12-17T00:00:00.000Z',
    input_tokens: 1,
    cached_input_tokens: 2,
    output_tokens: 3,
    reasoning_output_tokens: 0,
    total_tokens: 6,
    billable_total_tokens: 0
  }
];

const updates = buildUpdates(rows);
assert.equal(updates.length, 1);
assert.equal(updates[0].billable_total_tokens, '4');
assert.equal(updates[0].billable_rule_version, BILLABLE_RULE_VERSION);

const skipped = buildUpdates([{ ...rows[0], billable_total_tokens: '4' }]);
assert.equal(skipped.length, 0);

test('buildCursorFilter builds composite keyset cursor', () => {
  const cursor = {
    hour_start: '2025-12-17T00:00:00.000Z',
    user_id: 'u1',
    project_key: 'victorGPT/vibeusage',
    source: 'codex'
  };
  const filter = buildCursorFilter(cursor);
  assert.ok(filter.includes('hour_start.gt.2025-12-17T00:00:00.000Z'));
  assert.ok(filter.includes('and(hour_start.eq.2025-12-17T00:00:00.000Z,user_id.gt.u1)'));
  assert.ok(filter.includes('and(hour_start.eq.2025-12-17T00:00:00.000Z,user_id.eq.u1,project_key.gt.victorGPT/vibeusage)'));
  assert.ok(filter.includes('and(hour_start.eq.2025-12-17T00:00:00.000Z,user_id.eq.u1,project_key.eq.victorGPT/vibeusage,source.gt.codex)'));
});

test('buildCursorFilter keeps raw values for URL encoding', () => {
  const cursor = {
    hour_start: '2025-12-17T00:00:00.000Z',
    user_id: 'user,1',
    project_key: 'owner/repo',
    source: 'co)dex'
  };
  const filter = buildCursorFilter(cursor);
  assert.ok(filter.includes('user_id.eq.user,1'));
  assert.ok(filter.includes('project_key.eq.owner/repo'));
  assert.ok(filter.includes('source.gt.co)dex'));
});

test('URLSearchParams encodes cursor filter safely', () => {
  const cursor = {
    hour_start: '2025-12-17T00:00:00.000Z',
    user_id: 'user,1',
    project_key: 'owner/repo',
    source: 'co)dex'
  };
  const filter = buildCursorFilter(cursor);
  const url = new URL('http://localhost');
  url.searchParams.set('or', filter);
  const query = url.toString();
  assert.ok(query.includes('user_id.eq.user%2C1'));
  assert.ok(query.includes('source.gt.co%29dex'));
});

test('runBackfill paginates with cursor without skipping rows', async () => {
  const orderedRows = [
    {
      hour_start: '2025-12-17T00:00:00.000Z',
      user_id: 'u1',
      device_id: 'd1',
      source: 'codex',
      project_key: 'owner1/repo1',
      project_ref: 'repo:1',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 1,
      reasoning_output_tokens: 0,
      total_tokens: 2,
      billable_total_tokens: 0
    },
    {
      hour_start: '2025-12-17T00:00:00.000Z',
      user_id: 'u1',
      device_id: 'd1',
      source: 'codex',
      project_key: 'owner1/repo2',
      project_ref: 'repo:2',
      input_tokens: 2,
      cached_input_tokens: 0,
      output_tokens: 1,
      reasoning_output_tokens: 0,
      total_tokens: 3,
      billable_total_tokens: 0
    },
    {
      hour_start: '2025-12-17T01:00:00.000Z',
      user_id: 'u2',
      device_id: 'd2',
      source: 'codex',
      project_key: 'owner2/repo',
      project_ref: 'repo:3',
      input_tokens: 1,
      cached_input_tokens: 1,
      output_tokens: 1,
      reasoning_output_tokens: 0,
      total_tokens: 3,
      billable_total_tokens: 0
    }
  ];

  const compareRows = (left, right) => {
    const fields = ['hour_start', 'user_id', 'project_key', 'source'];
    for (const field of fields) {
      if (left[field] === right[field]) continue;
      return left[field] > right[field] ? 1 : -1;
    }
    return 0;
  };

  const calls = [];
  const updatesOut = [];

  const fetchBatch = async (args) => {
    assert.ok(Object.prototype.hasOwnProperty.call(args, 'cursor'));
    const { cursor, limit } = args;
    calls.push(cursor ? { ...cursor } : null);
    let startIndex = 0;
    if (cursor) {
      startIndex = orderedRows.findIndex((row) => compareRows(row, cursor) > 0);
      if (startIndex === -1) return [];
    }
    return orderedRows.slice(startIndex, startIndex + limit);
  };

  const upsertBatch = async ({ updates: batch }) => {
    updatesOut.push(...batch);
    return { updated: batch.length };
  };

  const result = await runBackfill({
    from: null,
    to: null,
    userId: null,
    projectKey: null,
    batchSize: 2,
    sleepMs: 0,
    dryRun: false,
    fetchBatch,
    upsertBatch
  });

  assert.equal(result.totalUpdated, orderedRows.length);
  assert.equal(updatesOut.length, orderedRows.length);
  assert.equal(result.totalSkippedCursor, 0);
  const uniqueKeys = new Set(
    updatesOut.map(
      (row) => `${row.hour_start}|${row.user_id}|${row.project_key}|${row.source}`
    )
  );
  assert.equal(uniqueKeys.size, orderedRows.length);
  assert.equal(calls[0], null);
  assert.deepEqual(calls[1], {
    hour_start: '2025-12-17T00:00:00.000Z',
    user_id: 'u1',
    project_key: 'owner1/repo2',
    source: 'codex'
  });
});
