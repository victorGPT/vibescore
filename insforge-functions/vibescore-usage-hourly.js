// Edge function: vibescore-usage-hourly
// Returns hourly token usage aggregates for the authenticated user (timezone-aware).

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const {
  addDatePartsDays,
  addUtcDays,
  formatDateParts,
  formatDateUTC,
  getLocalParts,
  isUtcTimeZone,
  getUsageTimeZoneContext,
  localDatePartsToUtc,
  parseDateParts,
  parseUtcDateString
} = require('../shared/date');
const { toBigInt } = require('../shared/numbers');

const MIN_INTERVAL_MINUTES = 30;

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'GET');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const tzContext = getUsageTimeZoneContext(url);

  if (isUtcTimeZone(tzContext)) {
    const dayRaw = url.searchParams.get('day');
    const today = parseUtcDateString(formatDateUTC(new Date()));
    const day = dayRaw ? parseUtcDateString(dayRaw) : today;
    if (!day) return json({ error: 'Invalid day' }, 400);

    const startIso = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0)
    ).toISOString();
    const endDate = addUtcDays(day, 1);
    const endIso = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 0, 0, 0)
    ).toISOString();

    const dayLabel = formatDateUTC(day);
    const { hourKeys, buckets, bucketMap } = initHourlyBuckets(dayLabel);
    const syncMeta = await getSyncMeta({ edgeClient: auth.edgeClient, userId: auth.userId, day });

    const aggregateRows = await tryAggregateHourlyTotals({
      edgeClient: auth.edgeClient,
      userId: auth.userId,
      startIso,
      endIso
    });

    if (aggregateRows) {
      for (const row of aggregateRows) {
        const key = formatHourKeyFromValue(row?.hour);
        const bucket = key ? bucketMap.get(key) : null;
        if (!bucket) continue;

        bucket.total += toBigInt(row?.sum_total_tokens);
        bucket.input += toBigInt(row?.sum_input_tokens);
        bucket.cached += toBigInt(row?.sum_cached_input_tokens);
        bucket.output += toBigInt(row?.sum_output_tokens);
        bucket.reasoning += toBigInt(row?.sum_reasoning_output_tokens);
      }

      return json(
        {
          day: dayLabel,
          data: buildHourlyResponse(hourKeys, bucketMap, syncMeta?.missingAfterHour),
          sync: buildSyncResponse(syncMeta)
        },
        200
      );
    }

    const { data, error } = await auth.edgeClient.database
      .from('vibescore_tracker_events')
      .select('token_timestamp,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens')
      .eq('user_id', auth.userId)
      .gte('token_timestamp', startIso)
      .lt('token_timestamp', endIso);

    if (error) return json({ error: error.message }, 500);

    for (const row of data || []) {
      const ts = row?.token_timestamp;
      if (!ts) continue;
      const dt = new Date(ts);
      if (!Number.isFinite(dt.getTime())) continue;
      const hour = dt.getUTCHours();
      if (hour < 0 || hour > 23) continue;

      const bucket = buckets[hour];
      bucket.total += toBigInt(row?.total_tokens);
      bucket.input += toBigInt(row?.input_tokens);
      bucket.cached += toBigInt(row?.cached_input_tokens);
      bucket.output += toBigInt(row?.output_tokens);
      bucket.reasoning += toBigInt(row?.reasoning_output_tokens);
    }

    return json(
      {
        day: dayLabel,
        data: buildHourlyResponse(hourKeys, bucketMap, syncMeta?.missingAfterHour),
        sync: buildSyncResponse(syncMeta)
      },
      200
    );
  }

  const dayRaw = url.searchParams.get('day');
  const todayKey = formatDateParts(getLocalParts(new Date(), tzContext));
  if (dayRaw && !parseDateParts(dayRaw)) return json({ error: 'Invalid day' }, 400);
  const dayKey = dayRaw || todayKey;
  const dayParts = parseDateParts(dayKey);
  if (!dayParts) return json({ error: 'Invalid day' }, 400);

  const startUtc = localDatePartsToUtc({ ...dayParts, hour: 0, minute: 0, second: 0 }, tzContext);
  const endUtc = localDatePartsToUtc(addDatePartsDays(dayParts, 1), tzContext);
  const startIso = startUtc.toISOString();
  const endIso = endUtc.toISOString();

  const { data, error } = await auth.edgeClient.database
    .from('vibescore_tracker_events')
    .select('token_timestamp,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens')
    .eq('user_id', auth.userId)
    .gte('token_timestamp', startIso)
    .lt('token_timestamp', endIso);

  if (error) return json({ error: error.message }, 500);

  const buckets = Array.from({ length: 24 }, () => ({
    total: 0n,
    input: 0n,
    cached: 0n,
    output: 0n,
    reasoning: 0n
  }));

  for (const row of data || []) {
    const ts = row?.token_timestamp;
    if (!ts) continue;
    const dt = new Date(ts);
    if (!Number.isFinite(dt.getTime())) continue;
    const localParts = getLocalParts(dt, tzContext);
    const localDay = formatDateParts(localParts);
    if (localDay !== dayKey) continue;
    const hour = Number(localParts.hour);
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) continue;

    const bucket = buckets[hour];
    bucket.total += toBigInt(row?.total_tokens);
    bucket.input += toBigInt(row?.input_tokens);
    bucket.cached += toBigInt(row?.cached_input_tokens);
    bucket.output += toBigInt(row?.output_tokens);
    bucket.reasoning += toBigInt(row?.reasoning_output_tokens);
  }

  const dataRows = buckets.map((bucket, hour) => ({
    hour: `${dayKey}T${String(hour).padStart(2, '0')}:00:00`,
    total_tokens: bucket.total.toString(),
    input_tokens: bucket.input.toString(),
    cached_input_tokens: bucket.cached.toString(),
    output_tokens: bucket.output.toString(),
    reasoning_output_tokens: bucket.reasoning.toString()
  }));

  return json({ day: dayKey, data: dataRows, sync: { last_sync_at: null, min_interval_minutes: MIN_INTERVAL_MINUTES } }, 200);
};

function initHourlyBuckets(dayLabel) {
  const hourKeys = [];
  const buckets = Array.from({ length: 24 }, () => ({
    total: 0n,
    input: 0n,
    cached: 0n,
    output: 0n,
    reasoning: 0n
  }));
  const bucketMap = new Map();

  for (let hour = 0; hour < 24; hour += 1) {
    const key = `${dayLabel}T${String(hour).padStart(2, '0')}:00:00`;
    hourKeys.push(key);
    bucketMap.set(key, buckets[hour]);
  }

  return { hourKeys, buckets, bucketMap };
}

function buildHourlyResponse(hourKeys, bucketMap, missingAfterHour) {
  return hourKeys.map((key) => {
    const bucket = bucketMap.get(key);
    const row = {
      hour: key,
      total_tokens: bucket.total.toString(),
      input_tokens: bucket.input.toString(),
      cached_input_tokens: bucket.cached.toString(),
      output_tokens: bucket.output.toString(),
      reasoning_output_tokens: bucket.reasoning.toString()
    };
    if (typeof missingAfterHour === 'number') {
      const hour = Number(key.slice(11, 13));
      if (Number.isFinite(hour) && hour > missingAfterHour) {
        row.missing = true;
      }
    }
    return row;
  });
}

function formatHourKeyFromValue(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    if (value.length >= 13) {
      const day = value.slice(0, 10);
      const hour = value.slice(11, 13);
      if (day && hour) return `${day}T${hour}:00:00`;
    }
  }
  const dt = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(dt.getTime())) return null;
  const day = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
  const hour = String(dt.getUTCHours()).padStart(2, '0');
  return `${day}T${hour}:00:00`;
}

async function tryAggregateHourlyTotals({ edgeClient, userId, startIso, endIso }) {
  try {
    const { data, error } = await edgeClient.database
      .from('vibescore_tracker_events')
      .select(
        "hour:date_trunc('hour', token_timestamp),sum_total_tokens:sum(total_tokens),sum_input_tokens:sum(input_tokens),sum_cached_input_tokens:sum(cached_input_tokens),sum_output_tokens:sum(output_tokens),sum_reasoning_output_tokens:sum(reasoning_output_tokens)"
      )
      .eq('user_id', userId)
      .gte('token_timestamp', startIso)
      .lt('token_timestamp', endIso)
      .order('hour', { ascending: true });

    if (error) return null;
    return data || [];
  } catch (_e) {
    return null;
  }
}

async function getSyncMeta({ edgeClient, userId, day }) {
  const lastSyncAt = await getLastSyncAt({ edgeClient, userId });
  const lastSyncIso = normalizeIso(lastSyncAt);
  if (!lastSyncIso || !(day instanceof Date)) {
    return { lastSyncAt: lastSyncIso, missingAfterHour: null };
  }

  const dayStartMs = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const dayEndMs = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1);
  const lastMs = Date.parse(lastSyncIso);
  if (!Number.isFinite(lastMs)) {
    return { lastSyncAt: lastSyncIso, missingAfterHour: null };
  }

  if (lastMs < dayStartMs) {
    return { lastSyncAt: lastSyncIso, missingAfterHour: -1 };
  }
  if (lastMs >= dayEndMs) {
    return { lastSyncAt: lastSyncIso, missingAfterHour: 23 };
  }

  const lastHour = new Date(lastMs).getUTCHours();
  return { lastSyncAt: lastSyncIso, missingAfterHour: lastHour };
}

async function getLastSyncAt({ edgeClient, userId }) {
  try {
    const { data, error } = await edgeClient.database
      .from('vibescore_tracker_device_tokens')
      .select('last_sync_at')
      .eq('user_id', userId)
      .order('last_sync_at', { ascending: false })
      .limit(1);

    if (error) return null;
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0]?.last_sync_at || null;
  } catch (_e) {
    return null;
  }
}

function normalizeIso(value) {
  if (typeof value !== 'string') return null;
  const dt = new Date(value);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt.toISOString();
}

function buildSyncResponse(syncMeta) {
  return {
    last_sync_at: syncMeta?.lastSyncAt || null,
    min_interval_minutes: MIN_INTERVAL_MINUTES
  };
}
