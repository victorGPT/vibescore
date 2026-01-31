// Edge function: vibeusage-project-usage-summary
// Returns project-level token usage totals for the authenticated user over a timezone-aware date range.

'use strict';

const { handleOptions, json } = require('../shared/http');
const { getBearerToken, getAccessContext } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { getSourceParam } = require('../shared/source');
const {
  addDatePartsDays,
  getUsageMaxDays,
  getUsageTimeZoneContext,
  listDateStrings,
  localDatePartsToUtc,
  normalizeDateRangeLocal,
  parseDateParts
} = require('../shared/date');
const { logSlowQuery, withRequestLogging } = require('../shared/logging');
const { isDebugEnabled, withSlowQueryDebugPayload } = require('../shared/debug');

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

  const tzContext = getUsageTimeZoneContext(url);
  const sourceResult = getSourceParam(url);
  if (!sourceResult.ok) return respond({ error: sourceResult.error }, 400, 0);
  const source = sourceResult.source;
  const { from, to } = normalizeDateRangeLocal(
    url.searchParams.get('from'),
    url.searchParams.get('to'),
    tzContext
  );

  const dayKeys = listDateStrings(from, to);
  const maxDays = getUsageMaxDays();
  if (dayKeys.length > maxDays) {
    return respond({ error: `Date range too large (max ${maxDays} days)` }, 400, 0);
  }

  const startParts = parseDateParts(from);
  const endParts = parseDateParts(to);
  if (!startParts || !endParts) return respond({ error: 'Invalid date range' }, 400, 0);

  const startUtc = localDatePartsToUtc(startParts, tzContext);
  const endUtc = localDatePartsToUtc(addDatePartsDays(endParts, 1), tzContext);
  const startIso = startUtc.toISOString();
  const endIso = endUtc.toISOString();

  const limit = normalizeLimit(url.searchParams.get('limit'));
  const queryStartMs = Date.now();

  let query = auth.edgeClient.database
    .from('vibeusage_project_usage_hourly')
    .select(
      'project_key,project_ref,sum_total_tokens:sum(total_tokens),sum_billable_total_tokens:sum(billable_total_tokens)'
    )
    .eq('user_id', auth.userId)
    .gte('hour_start', startIso)
    .lt('hour_start', endIso);

  if (source) query = query.eq('source', source);
  query = query
    .order('sum_billable_total_tokens', { ascending: false })
    .order('sum_total_tokens', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error) {
    const queryDurationMs = Date.now() - queryStartMs;
    return respond({ error: error.message }, 500, queryDurationMs);
  }

  const entries = (Array.isArray(data) ? data : [])
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

  const queryDurationMs = Date.now() - queryStartMs;
  logSlowQuery(logger, {
    query_label: 'project_usage_summary',
    duration_ms: queryDurationMs,
    row_count: entries.length,
    range_days: dayKeys.length,
    source: source || null,
    tz: tzContext?.timeZone || null,
    tz_offset_minutes: Number.isFinite(tzContext?.offsetMinutes) ? tzContext.offsetMinutes : null
  });

  return respond(
    {
      from,
      to,
      generated_at: new Date().toISOString(),
      entries
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
