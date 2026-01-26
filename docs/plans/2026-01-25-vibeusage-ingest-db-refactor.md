# Vibeusage Ingest DB Layer Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align vibeusage ingest with "no RPC + single DB access layer" by moving device token lookup/upsert/touch/metrics into `insforge-src/shared/db/ingest.js` and keeping the handler thin.

**Architecture:** Add a dedicated ingest DB module that wraps records API + SDK paths (no RPC). Update `buildHourlyUsageQuery` to fail fast on missing `edgeClient` and handle errors in the caller.

**Tech Stack:** Node.js, Edge Functions, Supabase records API/SDK, node:test.

@software-engineering-protocol
@test-driven-development
@supabase-postgres-best-practices
@architecture-canvas

---

### Task 1: Add failing tests for ingest DB + hourly query guard

**Files:**
- Modify: `test/insforge-src-core-db.test.js`

**Step 1: Write failing tests**

```js
const ingestDb = require('../insforge-src/shared/db/ingest');

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
      text: async () => JSON.stringify([
        { id: 't1', user_id: 'u1', device_id: 'd1', revoked_at: null, last_sync_at: null }
      ])
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
```

**Step 2: Run tests to verify they fail**

Run: `node --test test/insforge-src-core-db.test.js`
Expected: FAIL (missing module/behavior).

---

### Task 2: Implement ingest DB module

**Files:**
- Create: `insforge-src/shared/db/ingest.js`

**Step 1: Write minimal implementation**

```js
'use strict';

const {
  buildAuthHeaders,
  isUpsertUnsupported,
  normalizeRows,
  readApiJson,
  recordsUpsert
} = require('./records');

const DEVICE_TOKEN_SELECT = 'id,user_id,device_id,revoked_at,last_sync_at';

function normalizeIso(value) {
  if (typeof value !== 'string') return null;
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt.toISOString();
}

function isWithinInterval(lastSyncAt, minutes) {
  const lastMs = Date.parse(lastSyncAt);
  if (!Number.isFinite(lastMs)) return false;
  const windowMs = Math.max(0, minutes) * 60 * 1000;
  return windowMs > 0 && Date.now() - lastMs < windowMs;
}

async function fetchDeviceTokenRow({ serviceClient, baseUrl, anonKey, tokenHash, fetcher }) {
  if (serviceClient?.database?.from) {
    const { data: tokenRow, error } = await serviceClient.database
      .from('vibeusage_tracker_device_tokens')
      .select(DEVICE_TOKEN_SELECT)
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!tokenRow || tokenRow.revoked_at) return null;
    return tokenRow;
  }
  if (!baseUrl || !anonKey) throw new Error('Anon key missing');
  const url = new URL('/api/database/records/vibeusage_tracker_device_tokens', baseUrl);
  url.searchParams.set('select', DEVICE_TOKEN_SELECT);
  url.searchParams.set('token_hash', `eq.${tokenHash}`);
  url.searchParams.set('limit', '1');

  const res = await (fetcher || fetch)(url.toString(), {
    method: 'GET',
    headers: buildAuthHeaders({ anonKey, tokenHash })
  });
  const { data, error } = await readApiJson(res);
  if (!res.ok) throw new Error(error || `HTTP ${res.status}`);

  const rows = normalizeRows(data);
  const tokenRow = rows?.[0] || null;
  if (!tokenRow || tokenRow.revoked_at) return null;
  return tokenRow;
}

async function updateRecord({ baseUrl, anonKey, tokenHash, table, match, values, fetcher }) {
  const url = new URL(`/api/database/records/${table}`, baseUrl);
  for (const [key, val] of Object.entries(match || {})) {
    url.searchParams.set(key, `eq.${val}`);
  }
  const res = await (fetcher || fetch)(url.toString(), {
    method: 'PATCH',
    headers: {
      ...buildAuthHeaders({ anonKey, tokenHash }),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(values)
  });
  const { data, error, code } = await readApiJson(res);
  return { ok: res.ok, status: res.status, data, error, code };
}

async function touchDeviceTokenAndDevice({
  serviceClient,
  baseUrl,
  anonKey,
  tokenHash,
  tokenRow,
  nowIso,
  fetcher,
  minIntervalMinutes = 30
}) {
  if (!tokenRow) return;
  const lastSyncAt = normalizeIso(tokenRow.last_sync_at);
  const shouldUpdateSync = !lastSyncAt || !isWithinInterval(lastSyncAt, minIntervalMinutes);
  const tokenUpdate = shouldUpdateSync
    ? { last_used_at: nowIso, last_sync_at: nowIso }
    : { last_used_at: nowIso };

  try {
    if (serviceClient?.database?.from) {
      await serviceClient.database
        .from('vibeusage_tracker_device_tokens')
        .update(tokenUpdate)
        .eq('id', tokenRow.id);
    } else if (baseUrl && anonKey) {
      await updateRecord({
        baseUrl,
        anonKey,
        tokenHash,
        table: 'vibeusage_tracker_device_tokens',
        match: { id: tokenRow.id },
        values: tokenUpdate,
        fetcher
      });
    }
  } catch (_e) {}

  try {
    if (serviceClient?.database?.from) {
      await serviceClient.database
        .from('vibeusage_tracker_devices')
        .update({ last_seen_at: nowIso })
        .eq('id', tokenRow.device_id);
    } else if (baseUrl && anonKey) {
      await updateRecord({
        baseUrl,
        anonKey,
        tokenHash,
        table: 'vibeusage_tracker_devices',
        match: { id: tokenRow.device_id },
        values: { last_seen_at: nowIso },
        fetcher
      });
    }
  } catch (_e) {}
}

async function upsertHourlyUsage({
  serviceClient,
  baseUrl,
  serviceRoleKey,
  anonKey,
  tokenHash,
  tokenRow,
  rows,
  nowIso,
  fetcher
}) {
  if (serviceClient && serviceRoleKey && baseUrl) {
    const url = new URL('/api/database/records/vibeusage_tracker_hourly', baseUrl);
    const res = await recordsUpsert({
      url,
      anonKey: serviceRoleKey,
      tokenHash,
      rows,
      onConflict: 'user_id,device_id,source,model,hour_start',
      prefer: 'return=representation',
      resolution: 'merge-duplicates',
      select: 'hour_start',
      fetcher
    });

    if (res.ok) {
      const insertedRows = normalizeRows(res.data);
      const inserted = Array.isArray(insertedRows) ? insertedRows.length : rows.length;
      await touchDeviceTokenAndDevice({ serviceClient, tokenRow, nowIso });
      return { ok: true, inserted, skipped: 0 };
    }

    if (!isUpsertUnsupported(res)) {
      return { ok: false, error: res.error || `HTTP ${res.status}`, inserted: 0, skipped: 0 };
    }
  }

  if (serviceClient?.database?.from) {
    const { error } = await serviceClient
      .database
      .from('vibeusage_tracker_hourly')
      .upsert(rows, { onConflict: 'user_id,device_id,source,model,hour_start' });
    if (error) return { ok: false, error: error.message, inserted: 0, skipped: 0 };
    await touchDeviceTokenAndDevice({ serviceClient, tokenRow, nowIso });
    return { ok: true, inserted: rows.length, skipped: 0 };
  }

  if (!anonKey || !baseUrl) {
    return { ok: false, error: 'Anon key missing', inserted: 0, skipped: 0 };
  }

  const url = new URL('/api/database/records/vibeusage_tracker_hourly', baseUrl);
  const res = await recordsUpsert({
    url,
    anonKey,
    tokenHash,
    rows,
    onConflict: 'user_id,device_id,source,model,hour_start',
    prefer: 'return=representation',
    resolution: 'merge-duplicates',
    select: 'hour_start',
    fetcher
  });

  if (res.ok) {
    const insertedRows = normalizeRows(res.data);
    const inserted = Array.isArray(insertedRows) ? insertedRows.length : rows.length;
    await touchDeviceTokenAndDevice({ baseUrl, anonKey, tokenHash, tokenRow, nowIso, fetcher });
    return { ok: true, inserted, skipped: 0 };
  }

  if (isUpsertUnsupported(res)) {
    return { ok: false, error: res.error || 'Half-hour upsert unsupported', inserted: 0, skipped: 0 };
  }

  return { ok: false, error: res.error || `HTTP ${res.status}`, inserted: 0, skipped: 0 };
}

async function recordIngestBatchMetrics({
  serviceClient,
  baseUrl,
  anonKey,
  tokenHash,
  tokenRow,
  bucketCount,
  inserted,
  skipped,
  source,
  fetcher
}) {
  if (!tokenRow) return;
  const row = {
    user_id: tokenRow.user_id,
    device_id: tokenRow.device_id,
    device_token_id: tokenRow.id,
    source: typeof source === 'string' ? source : null,
    bucket_count: Number.isFinite(bucketCount) ? Math.max(0, Math.floor(bucketCount)) : 0,
    inserted: Number.isFinite(inserted) ? Math.max(0, Math.floor(inserted)) : 0,
    skipped: Number.isFinite(skipped) ? Math.max(0, Math.floor(skipped)) : 0
  };

  try {
    if (serviceClient?.database?.from) {
      const { error } = await serviceClient
        .database
        .from('vibeusage_tracker_ingest_batches')
        .insert(row);
      if (error) throw new Error(error.message);
      return;
    }
    if (!anonKey || !baseUrl) return;
    const url = new URL('/api/database/records/vibeusage_tracker_ingest_batches', baseUrl);
    const res = await (fetcher || fetch)(url.toString(), {
      method: 'POST',
      headers: {
        ...buildAuthHeaders({ anonKey, tokenHash }),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(row)
    });
    if (!res.ok) {
      const { error } = await readApiJson(res);
      throw new Error(error || `HTTP ${res.status}`);
    }
  } catch (_e) {
    // best-effort metrics; ignore failures
  }
}

module.exports = {
  fetchDeviceTokenRow,
  touchDeviceTokenAndDevice,
  upsertHourlyUsage,
  recordIngestBatchMetrics
};
```

**Step 2: Run tests**

Run: `node --test test/insforge-src-core-db.test.js`
Expected: PASS (new ingest DB module + hourly guard).

---

### Task 3: Guard `buildHourlyUsageQuery` + handle error in caller

**Files:**
- Modify: `insforge-src/shared/db/usage-hourly.js`
- Modify: `insforge-src/functions/vibeusage-usage-monthly.js`

**Step 1: Update guard**

```js
if (!edgeClient?.database?.from) {
  throw new Error('edgeClient is required');
}
```

**Step 2: Handle in caller**

Wrap `forEachPage` in `try/catch` and return a diagnostic 500 on error.

**Step 3: Run targeted tests**

Run: `node --test test/insforge-src-core-db.test.js`
Expected: PASS.

---

### Task 4: Refactor `vibeusage-ingest` handler to use db module

**Files:**
- Modify: `insforge-src/functions/vibeusage-ingest.js`

**Step 1: Replace local DB helpers with shared db calls**

```js
const {
  fetchDeviceTokenRow,
  recordIngestBatchMetrics,
  upsertHourlyUsage
} = require('../shared/db/ingest');
```

Replace `getTokenRowWithServiceClient/getTokenRowWithAnonKey`, `upsertWithServiceClient/upsertWithAnonKey`, and `bestEffortTouch*` usage with the shared db functions. Remove RPC usage entirely.

**Step 2: Run ingest-related tests**

Run: `node --test test/insforge-src-core-db.test.js`
Expected: PASS.

---

### Task 5: Update architecture canvas + OpenSpec task status

**Files:**
- Modify: `architecture.canvas`
- Modify: `openspec/changes/2026-01-25-refactor-backend-core/tasks.md`

**Step 1: Update canvas status**

- Keep `utils_ingest-db_6f9a0b1c` as `Status: Proposed` until code lands.
- After implementation, re-run `node scripts/ops/architecture-canvas.cjs` and update status to `Implemented` on the ingest DB node.

**Step 2: Update OpenSpec tasks**

Mark the ingest handler migration under `1.4` as complete when done.

---

### Task 6: Regression + verification

**Step 1: Run regression suite**

Run: `node --test test/*.test.js`
Expected: PASS.

**Step 2: Build check**

Run: `npm run build:insforge:check`
Expected: PASS.

**Step 3: Record verification**

Update `openspec/changes/2026-01-25-refactor-backend-core/verification-report.md` with commands + results.
