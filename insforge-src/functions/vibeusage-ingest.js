// Edge function: vibeusage-ingest
// Accepts half-hour token usage aggregates from a device token and stores them idempotently.
//
// Auth:
// - Authorization: Bearer <device_token> (opaque, stored as sha256 hash server-side)

'use strict';

const { handleOptions, json, requireMethod, readJson } = require('../shared/http');
const { withRequestLogging } = require('../shared/logging');
const { createConcurrencyGuard } = require('../shared/concurrency');
const { getBearerToken } = require('../shared/auth');
const { getAnonKey, getBaseUrl, getServiceRoleKey } = require('../shared/env');
const { sha256Hex } = require('../shared/crypto');
const {
  BILLABLE_RULE_VERSION,
  buildRows,
  deriveMetricsSource,
  normalizeHourlyPayload
} = require('../shared/core/ingest');
const {
  buildAuthHeaders,
  isUpsertUnsupported,
  normalizeRows,
  readApiJson,
  recordsUpsert
} = require('../shared/db/records');

const MAX_BUCKETS = 500;

const ingestGuard = createConcurrencyGuard({
  name: 'vibeusage-ingest',
  envKey: ['VIBEUSAGE_INGEST_MAX_INFLIGHT'],
  defaultMax: 0,
  retryAfterEnvKey: ['VIBEUSAGE_INGEST_RETRY_AFTER_MS'],
  defaultRetryAfterMs: 1000
});

module.exports = withRequestLogging('vibeusage-ingest', async function(request, logger) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'POST');
  if (methodErr) return methodErr;

  const deviceToken = getBearerToken(request.headers.get('Authorization'));
  if (!deviceToken) return json({ error: 'Missing bearer token' }, 401);

  const guard = ingestGuard?.acquire();
  if (guard && !guard.ok) {
    return json({ error: 'Too many requests' }, 429, guard.headers);
  }

  const fetcher = logger?.fetch || fetch;
  const baseUrl = getBaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  const anonKey = getAnonKey();
  const serviceClient = serviceRoleKey
    ? createClient({
        baseUrl,
        anonKey: anonKey || serviceRoleKey,
        edgeFunctionToken: serviceRoleKey
      })
    : null;

  try {
    const tokenHash = await sha256Hex(deviceToken);
    let tokenRow = null;
    try {
      tokenRow = serviceClient
        ? await getTokenRowWithServiceClient(serviceClient, tokenHash)
        : await getTokenRowWithAnonKey({ baseUrl, anonKey, tokenHash, fetcher });
    } catch (e) {
      return json({ error: e?.message || 'Internal error' }, 500);
    }
    if (!tokenRow) return json({ error: 'Unauthorized' }, 401);

    const body = await readJson(request);
    if (body.error) return json({ error: body.error }, body.status);

    const hourly = normalizeHourlyPayload(body.data);
    if (!Array.isArray(hourly)) {
      return json({ error: 'Invalid payload: expected {hourly:[...]} or [...]' }, 400);
    }
    if (hourly.length > MAX_BUCKETS) return json({ error: `Too many buckets (max ${MAX_BUCKETS})` }, 413);

    const nowIso = new Date().toISOString();
    const rows = buildRows({ hourly, tokenRow, nowIso, billableRuleVersion: BILLABLE_RULE_VERSION });
    if (rows.error) return json({ error: rows.error }, 400);

    if (rows.data.length === 0) {
      await recordIngestBatchMetrics({
        serviceClient,
        baseUrl,
        anonKey,
        tokenHash,
        tokenRow,
        bucketCount: 0,
        inserted: 0,
        skipped: 0,
        source: null,
        fetcher
      });
      return json({ success: true, inserted: 0, skipped: 0 }, 200);
    }

    const upsert = serviceClient
      ? await upsertWithServiceClient({
          serviceClient,
          tokenRow,
          rows: rows.data,
          nowIso,
          baseUrl,
          serviceRoleKey,
          tokenHash,
          fetcher
        })
      : await upsertWithAnonKey({ baseUrl, anonKey, tokenHash, tokenRow, rows: rows.data, nowIso, fetcher });

    if (!upsert.ok) return json({ error: upsert.error }, 500);

    await recordIngestBatchMetrics({
      serviceClient,
      baseUrl,
      anonKey,
      tokenHash,
      tokenRow,
      bucketCount: rows.data.length,
      inserted: upsert.inserted,
      skipped: upsert.skipped,
      source: deriveMetricsSource(rows.data),
      fetcher
    });

    return json(
      {
        success: true,
        inserted: upsert.inserted,
        skipped: upsert.skipped
      },
      200
    );
  } finally {
    if (guard && typeof guard.release === 'function') guard.release();
  }
});

async function getTokenRowWithServiceClient(serviceClient, tokenHash) {
  const { data: tokenRow, error: tokenErr } = await serviceClient.database
    .from('vibeusage_tracker_device_tokens')
    .select('id,user_id,device_id,revoked_at,last_sync_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (tokenErr) throw new Error(tokenErr.message);
  if (!tokenRow || tokenRow.revoked_at) return null;
  return tokenRow;
}

async function getTokenRowWithAnonKey({ baseUrl, anonKey, tokenHash, fetcher }) {
  if (!anonKey) throw new Error('Anon key missing');
  const url = new URL('/api/database/records/vibeusage_tracker_device_tokens', baseUrl);
  url.searchParams.set('select', 'id,user_id,device_id,revoked_at,last_sync_at');
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

async function upsertWithServiceClient({
  serviceClient,
  tokenRow,
  rows,
  nowIso,
  baseUrl,
  serviceRoleKey,
  tokenHash,
  fetcher
}) {
  if (serviceRoleKey && baseUrl) {
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
      await bestEffortTouchWithServiceClient(serviceClient, tokenRow, nowIso);
      return { ok: true, inserted, skipped: 0 };
    }

    if (!isUpsertUnsupported(res)) {
      return { ok: false, error: res.error || `HTTP ${res.status}`, inserted: 0, skipped: 0 };
    }
  }

  const table = serviceClient.database.from('vibeusage_tracker_hourly');
  if (typeof table?.upsert === 'function') {
    const { error } = await table.upsert(rows, { onConflict: 'user_id,device_id,source,model,hour_start' });
    if (error) return { ok: false, error: error.message, inserted: 0, skipped: 0 };
    await bestEffortTouchWithServiceClient(serviceClient, tokenRow, nowIso);
    return { ok: true, inserted: rows.length, skipped: 0 };
  }

  return { ok: false, error: 'Half-hour upsert unsupported', inserted: 0, skipped: 0 };
}

async function upsertWithAnonKey({ baseUrl, anonKey, tokenHash, tokenRow, rows, nowIso, fetcher }) {
  if (!anonKey) return { ok: false, error: 'Anon key missing', inserted: 0, skipped: 0 };

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
    await bestEffortTouchWithAnonKey({ baseUrl, anonKey, tokenHash, fetcher });
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
    bucket_count: toNonNegativeInt(bucketCount) ?? 0,
    inserted: toNonNegativeInt(inserted) ?? 0,
    skipped: toNonNegativeInt(skipped) ?? 0
  };

  try {
    if (serviceClient) {
      const { error } = await serviceClient.database.from('vibeusage_tracker_ingest_batches').insert(row);
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

async function bestEffortTouchWithServiceClient(serviceClient, tokenRow, nowIso) {
  const lastSyncAt = normalizeIso(tokenRow?.last_sync_at);
  const shouldUpdateSync = !lastSyncAt || !isWithinInterval(lastSyncAt, 30);
  try {
    await serviceClient.database
      .from('vibeusage_tracker_device_tokens')
      .update(shouldUpdateSync ? { last_used_at: nowIso, last_sync_at: nowIso } : { last_used_at: nowIso })
      .eq('id', tokenRow.id);
  } catch (_e) {}
  try {
    await serviceClient.database
      .from('vibeusage_tracker_devices')
      .update({ last_seen_at: nowIso })
      .eq('id', tokenRow.device_id);
  } catch (_e) {}
}

async function bestEffortTouchWithAnonKey({ baseUrl, anonKey, tokenHash, fetcher }) {
  if (!anonKey) return;
  try {
    const url = new URL('/api/database/rpc/vibeusage_touch_device_token_sync', baseUrl);
    await (fetcher || fetch)(url.toString(), {
      method: 'POST',
      headers: {
        ...buildAuthHeaders({ anonKey, tokenHash }),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ min_interval_minutes: 30 })
    });
  } catch (_e) {}
}

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
