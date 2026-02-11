const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ingestCore = require('../insforge-src/shared/core/ingest');
const usageSummaryCore = require('../insforge-src/shared/core/usage-summary');
const records = require('../insforge-src/shared/db/records');
const usageMonthlyCore = require('../insforge-src/shared/core/usage-monthly');
const usageDailyCore = require('../insforge-src/shared/core/usage-daily');
const usageFilter = require('../insforge-src/shared/core/usage-filter');
const usageHourlyDb = require('../insforge-src/shared/db/usage-hourly');
const ingestDb = require('../insforge-src/shared/db/ingest');

test('normalizeHourlyPayload accepts supported shapes', () => {
  assert.deepEqual(ingestCore.normalizeHourlyPayload([{}]), [{}]);
  assert.deepEqual(ingestCore.normalizeHourlyPayload({ hourly: [{}] }), [{}]);
  assert.deepEqual(ingestCore.normalizeHourlyPayload({ data: [{}, {}] }), [{}, {}]);
  assert.deepEqual(ingestCore.normalizeHourlyPayload({ data: { hourly: [{ ok: true }] } }), [{ ok: true }]);
  assert.equal(ingestCore.normalizeHourlyPayload({}), null);
});

test('normalizeDeviceSubscriptionsPayload accepts supported shapes', () => {
  assert.deepEqual(ingestCore.normalizeDeviceSubscriptionsPayload({ device_subscriptions: [{ tool: 'codex' }] }), [
    { tool: 'codex' }
  ]);
  assert.deepEqual(
    ingestCore.normalizeDeviceSubscriptionsPayload({ data: { device_subscriptions: [{ tool: 'claude' }] } }),
    [{ tool: 'claude' }]
  );
  assert.equal(ingestCore.normalizeDeviceSubscriptionsPayload({}), null);
});

test('parseHourlyBucket validates half-hour boundaries and tokens', () => {
  const valid = ingestCore.parseHourlyBucket({
    hour_start: '2026-01-25T10:30:00.000Z',
    source: 'codex',
    model: 'gpt-4o',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 2,
    reasoning_output_tokens: 0,
    total_tokens: 3
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.value.hour_start, '2026-01-25T10:30:00.000Z');
  assert.equal(valid.value.total_tokens, 3);

  const invalid = ingestCore.parseHourlyBucket({ hour_start: '2026-01-25T10:31:00.000Z' });
  assert.equal(invalid.ok, false);
});

test('parseProjectHourlyBucket validates half-hour boundaries and project fields', () => {
  const valid = ingestCore.parseProjectHourlyBucket({
    hour_start: '2026-01-25T10:30:00.000Z',
    source: 'codex',
    project_key: 'proj_1',
    project_ref: 'https://github.com/victorGPT/vibeusage',
    input_tokens: 1,
    cached_input_tokens: 0,
    output_tokens: 2,
    reasoning_output_tokens: 0,
    total_tokens: 3
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.value.project_key, 'proj_1');

  const invalid = ingestCore.parseProjectHourlyBucket({ hour_start: '2026-01-25T10:31:00.000Z' });
  assert.equal(invalid.ok, false);
});

test('buildRows dedupes hourly buckets by hour/source/model', () => {
  const nowIso = '2026-01-25T12:00:00.000Z';
  const tokenRow = { user_id: 'u1', device_id: 'd1', id: 't1' };
  const hourly = [
    {
      hour_start: '2026-01-25T10:00:00.000Z',
      source: 'codex',
      model: 'gpt-4o',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 1,
      reasoning_output_tokens: 0,
      total_tokens: 2
    },
    {
      hour_start: '2026-01-25T10:00:00.000Z',
      source: 'codex',
      model: 'gpt-4o',
      input_tokens: 1,
      cached_input_tokens: 0,
      output_tokens: 1,
      reasoning_output_tokens: 0,
      total_tokens: 2
    }
  ];
  const rows = ingestCore.buildRows({ hourly, tokenRow, nowIso });
  assert.equal(rows.error, null);
  assert.equal(rows.data.length, 1);
  assert.equal(rows.data[0].user_id, 'u1');
});

test('buildSubscriptionRows dedupes by tool/provider/product and normalizes values', () => {
  const nowIso = '2026-02-11T12:00:00.000Z';
  const tokenRow = { user_id: 'u1', device_id: 'd1', id: 't1' };
  const subscriptions = [
    { tool: 'codex', provider: 'openai', product: 'chatgpt', planType: 'pro' },
    { tool: 'codex', provider: 'openai', product: 'chatgpt', planType: 'plus' },
    {
      tool: 'claude',
      provider: 'anthropic',
      product: 'subscription',
      planType: 'max',
      rateLimitTier: 'default_claude_max_5x'
    }
  ];

  const rows = ingestCore.buildSubscriptionRows({ subscriptions, tokenRow, nowIso });
  assert.equal(rows.error, null);
  assert.equal(rows.data.length, 2);
  const codex = rows.data.find((row) => row.tool === 'codex');
  const claude = rows.data.find((row) => row.tool === 'claude');
  assert.equal(codex.plan_type, 'plus');
  assert.equal(claude.rate_limit_tier, 'default_claude_max_5x');
  assert.equal(claude.user_id, 'u1');
  assert.equal(claude.device_token_id, 't1');
});

test('pricing bucket key helpers round-trip JSON encoding', () => {
  const key = usageSummaryCore.buildPricingBucketKey('codex', 'gpt-4o', '2026-01-25');
  const parsed = usageSummaryCore.parsePricingBucketKey(key, 'fallback');
  assert.equal(parsed.usageKey, 'gpt-4o');
  assert.equal(parsed.dateKey, '2026-01-25');
});

test('pricing bucket key helpers handle legacy delimited keys', () => {
  const parsed = usageSummaryCore.parsePricingBucketKey('codex::gpt-4o::2026-01-25', 'fallback');
  assert.equal(parsed.usageKey, 'gpt-4o');
  assert.equal(parsed.dateKey, '2026-01-25');
});

test('recordsUpsert builds expected headers and query params', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ hour_start: '2026-01-25T10:00:00.000Z' }])
    };
  };

  const res = await records.recordsUpsert({
    url: new URL('https://example.com/api/database/records/vibeusage_tracker_hourly'),
    anonKey: 'anon',
    tokenHash: 'hash',
    rows: [{ id: 1 }],
    onConflict: 'user_id,device_id',
    prefer: 'return=representation',
    resolution: 'merge-duplicates',
    select: 'hour_start',
    fetcher: fakeFetch
  });

  assert.equal(res.ok, true);
  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.ok(url.includes('on_conflict=user_id%2Cdevice_id'));
  assert.ok(url.includes('select=hour_start'));
  assert.equal(init.headers.Authorization, 'Bearer anon');
  assert.equal(init.headers['x-vibeusage-device-token-hash'], 'hash');
  assert.ok(String(init.headers.Prefer || '').includes('return=representation'));
});

test('isUpsertUnsupported flags conflict-related errors', () => {
  assert.equal(records.isUpsertUnsupported({ status: 422, error: 'invalid on_conflict' }), true);
  assert.equal(records.isUpsertUnsupported({ status: 500, error: 'oops' }), false);
});

test('initMonthlyBuckets creates month keys and zeroed buckets', () => {
  const start = { year: 2026, month: 1, day: 1 };
  const { monthKeys, buckets } = usageMonthlyCore.initMonthlyBuckets({ startMonthParts: start, months: 2 });
  assert.deepEqual(monthKeys, ['2026-01', '2026-02']);
  assert.equal(buckets.get('2026-01').total, 0n);
  assert.equal(buckets.get('2026-02').billable, 0n);
});

test('ingestMonthlyRow accumulates token totals into buckets', () => {
  const start = { year: 2026, month: 1, day: 1 };
  const { buckets } = usageMonthlyCore.initMonthlyBuckets({ startMonthParts: start, months: 1 });
  const tzContext = { timeZone: 'UTC', offsetMinutes: 0 };
  const row = {
    hour_start: '2026-01-15T00:00:00.000Z',
    source: 'codex',
    total_tokens: 5,
    input_tokens: 2,
    cached_input_tokens: 1,
    output_tokens: 2,
    reasoning_output_tokens: 0,
    billable_total_tokens: 5
  };
  const ok = usageMonthlyCore.ingestMonthlyRow({
    buckets,
    row,
    tzContext,
    source: 'codex',
    canonicalModel: null,
    hasModelFilter: false,
    aliasTimeline: null,
    to: '2026-01-31'
  });
  assert.equal(ok, true);
  const bucket = buckets.get('2026-01');
  assert.equal(bucket.total, 5n);
  assert.equal(bucket.input, 2n);
  assert.equal(bucket.cached, 1n);
});

test('ingestMonthlyRow respects model filter mismatches', () => {
  const start = { year: 2026, month: 1, day: 1 };
  const { buckets } = usageMonthlyCore.initMonthlyBuckets({ startMonthParts: start, months: 1 });
  const tzContext = { timeZone: 'UTC', offsetMinutes: 0 };
  const row = {
    hour_start: '2026-01-15T00:00:00.000Z',
    source: 'codex',
    model: 'other',
    total_tokens: 5
  };
  const ok = usageMonthlyCore.ingestMonthlyRow({
    buckets,
    row,
    tzContext,
    source: 'codex',
    canonicalModel: 'gpt-4o',
    hasModelFilter: true,
    aliasTimeline: new Map(),
    to: '2026-01-31'
  });
  assert.equal(ok, false);
  assert.equal(buckets.get('2026-01').total, 0n);
});

test('buildHourlyUsageQuery applies filters and ordering', () => {
  const calls = [];
  const query = {
    eq: (field, value) => (calls.push(['eq', field, value]), query),
    gte: (field, value) => (calls.push(['gte', field, value]), query),
    lt: (field, value) => (calls.push(['lt', field, value]), query),
    order: (field, opts) => (calls.push(['order', field, opts]), query),
    neq: (field, value) => (calls.push(['neq', field, value]), query),
    or: (value) => (calls.push(['or', value]), query)
  };
  const edgeClient = {
    database: {
      from: (table) => (calls.push(['from', table]), {
        select: (cols) => (calls.push(['select', cols]), query)
      })
    }
  };

  usageHourlyDb.buildHourlyUsageQuery({
    edgeClient,
    userId: 'u1',
    source: 'codex',
    usageModels: ['gpt-4o'],
    canonicalModel: 'gpt-4o',
    startIso: '2026-01-01T00:00:00.000Z',
    endIso: '2026-01-02T00:00:00.000Z',
    select: 'hour_start,source,total_tokens'
  });

  assert.deepEqual(calls[0], ['from', 'vibeusage_tracker_hourly']);
  assert.deepEqual(calls[1], ['select', 'hour_start,source,total_tokens']);
  assert.ok(calls.find((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'u1'));
  assert.ok(calls.find((call) => call[0] === 'eq' && call[1] === 'source' && call[2] === 'codex'));
  assert.ok(calls.find((call) => call[0] === 'gte' && call[1] === 'hour_start'));
  assert.ok(calls.find((call) => call[0] === 'lt' && call[1] === 'hour_start'));
  assert.ok(calls.find((call) => call[0] === 'order' && call[1] === 'hour_start'));
});

test('buildHourlyUsageQuery throws when edgeClient missing', () => {
  assert.throws(() => usageHourlyDb.buildHourlyUsageQuery({}), /edgeClient/i);
});

test('fetchDeviceTokenRow uses records API and ignores revoked tokens', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([{ id: 't1', user_id: 'u1', device_id: 'd1', revoked_at: null, last_sync_at: null }])
    };
  };

  const tokenRow = await ingestDb.fetchDeviceTokenRow({
    baseUrl: 'https://example.com',
    anonKey: 'anon',
    tokenHash: 'hash',
    fetcher: fakeFetch
  });

  assert.equal(tokenRow.id, 't1');
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.includes('/api/database/records/vibeusage_tracker_device_tokens'));
  assert.ok(calls[0].url.includes('token_hash=eq.hash'));
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer anon');
});

test('upsertProjectUsage uses correct table and onConflict keys', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ hour_start: '2026-01-25T10:30:00.000Z' }])
    };
  };

  await ingestDb.upsertProjectUsage({
    baseUrl: 'https://example.com',
    anonKey: 'anon',
    tokenHash: 'hash',
    rows: [{ user_id: 'u1', project_key: 'p1', hour_start: '2026-01-25T10:30:00.000Z', source: 'codex' }],
    nowIso: '2026-01-25T12:00:00.000Z',
    fetcher: fakeFetch
  });

  assert.ok(calls[0].url.includes('/api/database/records/vibeusage_project_usage_hourly'));
  assert.ok(calls[0].url.includes('on_conflict=user_id%2Cproject_key%2Chour_start%2Csource'));
});

test('upsertDeviceSubscriptions uses correct table and onConflict keys', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ tool: 'codex', provider: 'openai', product: 'chatgpt' }])
    };
  };

  await ingestDb.upsertDeviceSubscriptions({
    baseUrl: 'https://example.com',
    anonKey: 'anon',
    tokenHash: 'hash',
    rows: [
      {
        user_id: 'u1',
        device_id: 'd1',
        device_token_id: 't1',
        tool: 'codex',
        provider: 'openai',
        product: 'chatgpt',
        plan_type: 'pro',
        observed_at: '2026-02-11T12:00:00.000Z',
        updated_at: '2026-02-11T12:00:00.000Z'
      }
    ],
    fetcher: fakeFetch
  });

  assert.ok(calls[0].url.includes('/api/database/records/vibeusage_tracker_subscriptions'));
  assert.ok(calls[0].url.includes('on_conflict=user_id%2Ctool%2Cprovider%2Cproduct'));
});

test('touchDeviceTokenAndDevice updates last_sync_at only when interval elapsed', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, status: 200, text: async () => '[]' };
  };

  await ingestDb.touchDeviceTokenAndDevice({
    baseUrl: 'https://example.com',
    anonKey: 'anon',
    tokenHash: 'hash',
    tokenRow: { id: 't1', device_id: 'd1', last_sync_at: '2026-01-25T00:00:00.000Z' },
    nowIso: '2026-01-25T01:00:00.000Z',
    fetcher: fakeFetch,
    minIntervalMinutes: 30
  });

  assert.equal(calls.length, 2);
  const tokenUpdate = JSON.parse(calls[0].init.body);
  assert.equal(tokenUpdate.last_used_at, '2026-01-25T01:00:00.000Z');
  assert.equal(tokenUpdate.last_sync_at, '2026-01-25T01:00:00.000Z');
});

test('shouldIncludeUsageRow matches canonical model when filter enabled', () => {
  const ok = usageFilter.shouldIncludeUsageRow({
    row: { hour_start: '2026-01-25T00:00:00.000Z', model: 'gpt-4o' },
    canonicalModel: 'gpt-4o',
    hasModelFilter: true,
    aliasTimeline: new Map(),
    to: '2026-01-25'
  });
  assert.equal(ok, true);
});

test('shouldIncludeUsageRow rejects mismatched model when filter enabled', () => {
  const ok = usageFilter.shouldIncludeUsageRow({
    row: { hour_start: '2026-01-25T00:00:00.000Z', model: 'other' },
    canonicalModel: 'gpt-4o',
    hasModelFilter: true,
    aliasTimeline: new Map(),
    to: '2026-01-25'
  });
  assert.equal(ok, false);
});

test('shouldIncludeUsageRow returns true when model filter disabled', () => {
  const ok = usageFilter.shouldIncludeUsageRow({
    row: { hour_start: '2026-01-25T00:00:00.000Z', model: 'gpt-4o' },
    canonicalModel: null,
    hasModelFilter: false,
    aliasTimeline: new Map(),
    to: '2026-01-25'
  });
  assert.equal(ok, true);
});

test('initDailyBuckets creates zeroed daily buckets', () => {
  const { buckets } = usageDailyCore.initDailyBuckets(['2026-01-25']);
  const bucket = buckets.get('2026-01-25');
  assert.equal(bucket.total, 0n);
  assert.equal(bucket.billable, 0n);
});

test('applyDailyBucket updates daily totals', () => {
  const { buckets } = usageDailyCore.initDailyBuckets(['2026-01-25']);
  const ok = usageDailyCore.applyDailyBucket({
    buckets,
    row: {
      hour_start: '2026-01-25T00:00:00.000Z',
      total_tokens: 5,
      input_tokens: 2,
      cached_input_tokens: 1,
      output_tokens: 2,
      reasoning_output_tokens: 0
    },
    tzContext: { timeZone: 'UTC', offsetMinutes: 0 },
    billable: 5n
  });
  assert.equal(ok, true);
  const bucket = buckets.get('2026-01-25');
  assert.equal(bucket.total, 5n);
  assert.equal(bucket.billable, 5n);
});

test('applyDailyBucket rejects invalid hour_start', () => {
  const { buckets } = usageDailyCore.initDailyBuckets(['2026-01-25']);
  const ok = usageDailyCore.applyDailyBucket({
    buckets,
    row: { hour_start: 'not-a-date', total_tokens: 1 },
    tzContext: { timeZone: 'UTC', offsetMinutes: 0 },
    billable: 0n
  });
  assert.equal(ok, false);
});

test('usage-monthly imports getLocalParts from shared/date', () => {
  const filePath = path.join(__dirname, '..', 'insforge-src', 'functions', 'vibeusage-usage-monthly.js');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.includes('getLocalParts'));
});

test('vibeusage-ingest uses shared ingest db and avoids RPC', () => {
  const filePath = path.join(__dirname, '..', 'insforge-src', 'functions', 'vibeusage-ingest.js');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.includes('shared/db/ingest'));
  assert.equal(content.includes('/api/database/rpc/vibeusage_touch_device_token_sync'), false);
});
