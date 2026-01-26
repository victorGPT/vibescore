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
  normalizeHourlyPayload,
  normalizeProjectHourlyPayload,
  buildProjectRows
} = require('../shared/core/ingest');
const {
  fetchDeviceTokenRow,
  recordIngestBatchMetrics,
  upsertHourlyUsage,
  upsertProjectUsage,
  upsertProjectRegistry
} = require('../shared/db/ingest');

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
      tokenRow = await fetchDeviceTokenRow({ serviceClient, baseUrl, anonKey, tokenHash, fetcher });
    } catch (e) {
      return json({ error: e?.message || 'Internal error' }, 500);
    }
    if (!tokenRow) return json({ error: 'Unauthorized' }, 401);

    const body = await readJson(request);
    if (body.error) return json({ error: body.error }, body.status);

    const hourly = normalizeHourlyPayload(body.data);
    const projectHourly = normalizeProjectHourlyPayload(body.data);
    if (!Array.isArray(hourly) && !Array.isArray(projectHourly)) {
      return json({ error: 'Invalid payload: expected {hourly:[...]} or [...]' }, 400);
    }
    if (Array.isArray(hourly) && hourly.length > MAX_BUCKETS) {
      return json({ error: `Too many buckets (max ${MAX_BUCKETS})` }, 413);
    }
    if (Array.isArray(projectHourly) && projectHourly.length > MAX_BUCKETS) {
      return json({ error: `Too many buckets (max ${MAX_BUCKETS})` }, 413);
    }

    const nowIso = new Date().toISOString();
    const rows = Array.isArray(hourly)
      ? buildRows({ hourly, tokenRow, nowIso, billableRuleVersion: BILLABLE_RULE_VERSION })
      : { error: null, data: [] };
    if (rows.error) return json({ error: rows.error }, 400);

    const projectRows = Array.isArray(projectHourly)
      ? buildProjectRows({ hourly: projectHourly, tokenRow, nowIso })
      : { error: null, data: [] };
    if (projectRows.error) return json({ error: projectRows.error }, 400);

    let projectInserted = 0;
    let projectSkipped = 0;

    if (projectRows.data.length > 0) {
      const registryByKey = new Map();
      for (const row of projectRows.data) {
        registryByKey.set(row.project_key, {
          user_id: row.user_id,
          project_key: row.project_key,
          project_ref: row.project_ref,
          updated_at: nowIso
        });
      }
      const registryRows = Array.from(registryByKey.values());

      const registryUpsert = await upsertProjectRegistry({
        serviceClient,
        baseUrl,
        serviceRoleKey,
        anonKey,
        tokenHash,
        rows: registryRows,
        fetcher
      });
      if (!registryUpsert.ok) return json({ error: registryUpsert.error }, 500);

      const projectUpsert = await upsertProjectUsage({
        serviceClient,
        baseUrl,
        serviceRoleKey,
        anonKey,
        tokenHash,
        tokenRow,
        rows: projectRows.data,
        nowIso,
        fetcher
      });
      if (!projectUpsert.ok) return json({ error: projectUpsert.error }, 500);
      projectInserted = projectUpsert.inserted;
      projectSkipped = projectUpsert.skipped;
    }

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
      return json(
        { success: true, inserted: 0, skipped: 0, project_inserted: projectInserted, project_skipped: projectSkipped },
        200
      );
    }

    const upsert = await upsertHourlyUsage({
      serviceClient,
      baseUrl,
      serviceRoleKey,
      anonKey,
      tokenHash,
      tokenRow,
      rows: rows.data,
      nowIso,
      fetcher
    });

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
        skipped: upsert.skipped,
        project_inserted: projectInserted,
        project_skipped: projectSkipped
      },
      200
    );
  } finally {
    if (guard && typeof guard.release === 'function') guard.release();
  }
});
