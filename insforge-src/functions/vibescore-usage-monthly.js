// Edge function: vibescore-usage-monthly
// Returns UTC monthly token usage aggregates for the authenticated user.

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { formatDateUTC, parseUtcDateString } = require('../shared/date');
const { toBigInt, toPositiveIntOrNull } = require('../shared/numbers');

const MAX_MONTHS = 24;

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
  const monthsRaw = url.searchParams.get('months');
  const monthsParsed = toPositiveIntOrNull(monthsRaw);
  const months = monthsParsed == null ? MAX_MONTHS : monthsParsed;
  if (months < 1 || months > MAX_MONTHS) return json({ error: 'Invalid months' }, 400);

  const toRaw = url.searchParams.get('to');
  const today = parseUtcDateString(formatDateUTC(new Date()));
  const toDate = toRaw ? parseUtcDateString(toRaw) : today;
  if (!toDate) return json({ error: 'Invalid to date' }, 400);

  const startMonth = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - (months - 1), 1));
  const from = formatDateUTC(startMonth);
  const to = formatDateUTC(toDate);

  const { data, error } = await auth.edgeClient.database
    .from('vibescore_tracker_daily')
    .select('day,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens')
    .eq('user_id', auth.userId)
    .gte('day', from)
    .lte('day', to)
    .order('day', { ascending: true });

  if (error) return json({ error: error.message }, 500);

  const monthKeys = [];
  const buckets = new Map();

  for (let i = 0; i < months; i += 1) {
    const dt = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + i, 1));
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
    monthKeys.push(key);
    buckets.set(key, {
      total: 0n,
      input: 0n,
      cached: 0n,
      output: 0n,
      reasoning: 0n
    });
  }

  for (const row of data || []) {
    const day = row?.day;
    if (typeof day !== 'string' || day.length < 7) continue;
    const key = day.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.total += toBigInt(row?.total_tokens);
    bucket.input += toBigInt(row?.input_tokens);
    bucket.cached += toBigInt(row?.cached_input_tokens);
    bucket.output += toBigInt(row?.output_tokens);
    bucket.reasoning += toBigInt(row?.reasoning_output_tokens);
  }

  const monthly = monthKeys.map((key) => {
    const bucket = buckets.get(key);
    return {
      month: key,
      total_tokens: bucket.total.toString(),
      input_tokens: bucket.input.toString(),
      cached_input_tokens: bucket.cached.toString(),
      output_tokens: bucket.output.toString(),
      reasoning_output_tokens: bucket.reasoning.toString()
    };
  });

  return json({ from, to, months, data: monthly }, 200);
};
