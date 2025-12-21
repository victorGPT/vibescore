// Edge function: vibescore-usage-hourly
// Returns UTC hourly token usage aggregates for the authenticated user.

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { addUtcDays, formatDateUTC, parseUtcDateString } = require('../shared/date');
const { toBigInt } = require('../shared/numbers');

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
  const dayRaw = url.searchParams.get('day');
  const today = parseUtcDateString(formatDateUTC(new Date()));
  const day = dayRaw ? parseUtcDateString(dayRaw) : today;
  if (!day) return json({ error: 'Invalid day' }, 400);

  const startIso = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0)).toISOString();
  const endDate = addUtcDays(day, 1);
  const endIso = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 0, 0, 0)).toISOString();

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
    const hour = dt.getUTCHours();
    if (hour < 0 || hour > 23) continue;

    const bucket = buckets[hour];
    bucket.total += toBigInt(row?.total_tokens);
    bucket.input += toBigInt(row?.input_tokens);
    bucket.cached += toBigInt(row?.cached_input_tokens);
    bucket.output += toBigInt(row?.output_tokens);
    bucket.reasoning += toBigInt(row?.reasoning_output_tokens);
  }

  const dayLabel = formatDateUTC(day);
  const dataRows = buckets.map((bucket, hour) => {
    const dt = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, 0, 0));
    return {
      hour: dt.toISOString(),
      total_tokens: bucket.total.toString(),
      input_tokens: bucket.input.toString(),
      cached_input_tokens: bucket.cached.toString(),
      output_tokens: bucket.output.toString(),
      reasoning_output_tokens: bucket.reasoning.toString()
    };
  });

  return json({ day: dayLabel, data: dataRows }, 200);
};
