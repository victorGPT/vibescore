// Edge function: vibeusage-project-usage-summary
// Returns project-level token usage totals for the authenticated user over a timezone-aware date range.

'use strict';

const { handleOptions, json } = require('../shared/http');
const { getBearerToken, getAccessContext } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { getSourceParam } = require('../shared/source');
const { logSlowQuery, withRequestLogging } = require('../shared/logging');
const { isCanaryTag } = require('../shared/canary');
const { isDebugEnabled, withSlowQueryDebugPayload } = require('../shared/debug');
const { toBigInt } = require('../shared/numbers');

const DEFAULT_LIMIT = 3;
const MAX_LIMIT = 10;

module.exports = withRequestLogging('vibeusage-project-usage-summary', async function(request, logger) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const url = new URL(request.url);
  const debugEnabled = isDebugEnabled(url);
  const respond = (body, status, durationMs) => json(
    debugEnabled ? withSlowQueryDebugPayload(body, { logger, durationMs, status }) : body,
    status
  );

  if (request.method !== 'GET') return respond({ error: 'Method not allowed' }, 405, 0);

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return respond({ error: 'Missing bearer token' }, 401, 0);

  const baseUrl = getBaseUrl();
  const auth = await getAccessContext({ baseUrl, bearer, allowPublic: true });
  if (!auth.ok) return respond({ error: 'Unauthorized' }, 401, 0);

  const sourceResult = getSourceParam(url);
  if (!sourceResult.ok) return respond({ error: sourceResult.error }, 400, 0);
  const source = sourceResult.source;
  const from = null;
  const to = null;

  const limit = normalizeLimit(url.searchParams.get('limit'));
  const queryStartMs = Date.now();

  let query = auth.edgeClient.database
    .from('vibeusage_project_usage_hourly')
    .select(
      'project_key,project_ref,sum_total_tokens:sum(total_tokens),sum_billable_total_tokens:sum(billable_total_tokens)'
    )
    .eq('user_id', auth.userId)

  if (source) query = query.eq('source', source);
  if (!isCanaryTag(source)) query = query.neq('source', 'canary');
  query = query
    .order('sum_billable_total_tokens', { ascending: false })
    .order('sum_total_tokens', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  let entries = null;
  if (error && shouldFallbackAggregate(error?.message)) {
    const fallback = await fetchProjectUsageFallback({
      edgeClient: auth.edgeClient,
      userId: auth.userId,
      source,
      limit
    });
    if (!fallback.ok) {
      const queryDurationMs = Date.now() - queryStartMs;
      return respond({ error: fallback.error }, 500, queryDurationMs);
    }
    entries = fallback.entries;
  } else if (error) {
    const queryDurationMs = Date.now() - queryStartMs;
    return respond({ error: error.message }, 500, queryDurationMs);
  } else {
    entries = (Array.isArray(data) ? data : [])
      .map((row) => {
        const totalTokens = normalizeAggregateValue(row?.sum_total_tokens);
        return {
          project_key: row?.project_key || null,
          project_ref: row?.project_ref || null,
          total_tokens: totalTokens,
          billable_total_tokens: resolveBillableTotal(totalTokens, row?.sum_billable_total_tokens)
        };
      })
      .filter((row) => row.project_key && row.project_ref);
  }

  const queryDurationMs = Date.now() - queryStartMs;
  logSlowQuery(logger, {
    query_label: 'project_usage_summary',
    duration_ms: queryDurationMs,
    row_count: entries.length,
    range_days: null,
    source: source || null,
    tz: null,
    tz_offset_minutes: null
  });

  return respond(
    {
      from,
      to,
      all_time: true,
      generated_at: new Date().toISOString(),
      entries: entries || []
    },
    200,
    queryDurationMs
  );
});

function normalizeLimit(raw) {
  if (typeof raw !== 'string' || raw.trim().length === 0) return DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  const i = Math.floor(n);
  if (i < 1) return 1;
  if (i > MAX_LIMIT) return MAX_LIMIT;
  return i;
}

function normalizeAggregateValue(value) {
  if (value == null) return '0';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return value.toString();
  return String(value);
}

function resolveBillableTotal(totalTokens, billableRaw) {
  if (billableRaw == null) return totalTokens;
  return normalizeAggregateValue(billableRaw);
}

function shouldFallbackAggregate(message) {
  if (typeof message !== 'string') return false;
  const normalized = message.toLowerCase();
  if (normalized.includes('aggregate functions is not allowed')) return true;
  return (
    normalized.includes('schema cache') &&
    normalized.includes('relationship') &&
    normalized.includes("'sum'")
  );
}

async function fetchProjectUsageFallback({ edgeClient, userId, source, limit }) {
  try {
    let query = edgeClient.database
      .from('vibeusage_project_usage_hourly')
      .select('project_key,project_ref,total_tokens,billable_total_tokens')
      .eq('user_id', userId)

    if (source) query = query.eq('source', source);
    if (!isCanaryTag(source)) query = query.neq('source', 'canary');

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    const entries = aggregateProjectRows(data, limit);
    return { ok: true, entries };
  } catch (err) {
    return { ok: false, error: err?.message || 'Fallback query failed' };
  }
}

function aggregateProjectRows(rows, limit) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const projectKey = typeof row?.project_key === 'string' ? row.project_key : null;
    const projectRef = typeof row?.project_ref === 'string' ? row.project_ref : null;
    if (!projectKey || !projectRef) continue;
    const key = `${projectKey}::${projectRef}`;
    let entry = map.get(key);
    if (!entry) {
      entry = {
        project_key: projectKey,
        project_ref: projectRef,
        total: 0n,
        billable: 0n
      };
      map.set(key, entry);
    }
    entry.total += toBigInt(row?.total_tokens);
    const billableRaw =
      row && Object.prototype.hasOwnProperty.call(row, 'billable_total_tokens')
        ? row.billable_total_tokens
        : null;
    const billable = billableRaw == null ? row?.total_tokens : billableRaw;
    entry.billable += toBigInt(billable);
  }

  const entries = Array.from(map.values()).map((entry) => ({
    project_key: entry.project_key,
    project_ref: entry.project_ref,
    total_tokens: entry.total.toString(),
    billable_total_tokens: entry.billable.toString()
  }));

  entries.sort((a, b) => {
    const aBillable = toBigInt(a.billable_total_tokens);
    const bBillable = toBigInt(b.billable_total_tokens);
    if (aBillable === bBillable) {
      const aTotal = toBigInt(a.total_tokens);
      const bTotal = toBigInt(b.total_tokens);
      if (aTotal === bTotal) return 0;
      return aTotal > bTotal ? -1 : 1;
    }
    return aBillable > bBillable ? -1 : 1;
  });

  if (!Number.isFinite(limit)) return entries;
  const safeLimit = Math.max(1, Math.floor(limit));
  return entries.slice(0, safeLimit);
}
