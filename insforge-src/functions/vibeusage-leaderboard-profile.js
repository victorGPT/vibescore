// Edge function: vibeusage-leaderboard-profile
// Returns the requested user's weekly leaderboard snapshot row when it is public (or self).

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getAnonKey, getBaseUrl, getServiceRoleKey } = require('../shared/env');
const { toUtcDay, addUtcDays, formatDateUTC } = require('../shared/date');
const { toBigInt, toPositiveIntOrNull } = require('../shared/numbers');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'GET');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: auth.error || 'Unauthorized' }, auth.status || 401);

  const url = new URL(request.url);
  const requestedUserId = normalizeUserId(url.searchParams.get('user_id'));
  if (!requestedUserId) return json({ error: 'user_id is required' }, 400);

  const { from, to } = computeWeekWindow();

  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) return json({ error: 'Service unavailable' }, 503);

  const anonKey = getAnonKey();
  const serviceClient = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken: serviceRoleKey
  });

  const isSelf = requestedUserId === auth.userId;
  if (!isSelf) {
    const { data: settings, error: settingsErr } = await serviceClient.database
      .from('vibeusage_user_settings')
      .select('leaderboard_public')
      .eq('user_id', requestedUserId)
      .maybeSingle();

    if (settingsErr) return json({ error: 'Failed to resolve leaderboard settings' }, 500);
    if (!settings?.leaderboard_public) return json({ error: 'Not found' }, 404);
  }

  const { data: snapshot, error: snapshotErr } = await serviceClient.database
    .from('vibeusage_leaderboard_snapshots')
    .select('user_id,display_name,avatar_url,rank,gpt_tokens,claude_tokens,total_tokens,generated_at')
    .eq('period', 'week')
    .eq('from_day', from)
    .eq('to_day', to)
    .eq('user_id', requestedUserId)
    .maybeSingle();

  if (snapshotErr) return json({ error: snapshotErr.message || 'Failed to fetch leaderboard snapshot' }, 500);
  if (!snapshot) return json({ error: 'Not found' }, 404);

  return json(
    {
      period: 'week',
      from,
      to,
      generated_at: normalizeGeneratedAt(snapshot.generated_at),
      entry: normalizeSnapshotEntry(snapshot)
    },
    200
  );
};

function normalizeUserId(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.length > 64) return null;
  if (!UUID_RE.test(trimmed)) return null;
  return trimmed;
}

function computeWeekWindow() {
  const now = new Date();
  const today = toUtcDay(now);
  const dow = today.getUTCDay(); // 0=Sunday
  const from = addUtcDays(today, -dow);
  const to = addUtcDays(from, 6);
  return { from: formatDateUTC(from), to: formatDateUTC(to) };
}

function normalizeGeneratedAt(value) {
  if (typeof value !== 'string') return new Date().toISOString();
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return new Date().toISOString();
  return dt.toISOString();
}

function normalizeSnapshotEntry(row) {
  const displayName = normalizeDisplayName(row?.display_name);
  const avatarUrl = normalizeAvatarUrl(row?.avatar_url);
  return {
    user_id: typeof row?.user_id === 'string' ? row.user_id : null,
    display_name: displayName,
    avatar_url: avatarUrl,
    rank: toPositiveIntOrNull(row?.rank),
    gpt_tokens: toBigInt(row?.gpt_tokens).toString(),
    claude_tokens: toBigInt(row?.claude_tokens).toString(),
    total_tokens: toBigInt(row?.total_tokens).toString()
  };
}

function normalizeDisplayName(value) {
  if (typeof value !== 'string') return 'Anonymous';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'Anonymous';
}

function normalizeAvatarUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

