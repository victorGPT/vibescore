// Edge function: vibeusage-leaderboard-settings
// Updates the current user's leaderboard privacy setting.

'use strict';

const { handleOptions, json, readJson } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getAnonKey, getBaseUrl, getServiceRoleKey } = require('../shared/env');
const { toUtcDay, addUtcDays, formatDateUTC } = require('../shared/date');

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: auth.error || 'Unauthorized' }, auth.status || 401);

  if (request.method === 'GET') {
    const { data, error } = await auth.edgeClient.database
      .from('vibeusage_user_settings')
      .select('leaderboard_public,updated_at')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);

    return json(
      {
        leaderboard_public: Boolean(data?.leaderboard_public),
        updated_at: typeof data?.updated_at === 'string' ? data.updated_at : null
      },
      200
    );
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const body = await readJson(request);
  if (body.error) return json({ error: body.error }, body.status);

  const leaderboardPublic = body.data?.leaderboard_public;
  if (typeof leaderboardPublic !== 'boolean') {
    return json({ error: 'leaderboard_public must be boolean' }, 400);
  }

  const updatedAt = new Date().toISOString();
  const upsertRow = {
    user_id: auth.userId,
    leaderboard_public: leaderboardPublic,
    updated_at: updatedAt
  };

  const settingsTable = auth.edgeClient.database.from('vibeusage_user_settings');
  if (typeof settingsTable.upsert === 'function') {
    try {
      const { error: upsertErr } = await settingsTable.upsert([upsertRow], { onConflict: 'user_id' });
      if (!upsertErr) {
        await trySyncSnapshot({ baseUrl, userId: auth.userId, leaderboardPublic });
        return json({ leaderboard_public: leaderboardPublic, updated_at: updatedAt }, 200);
      }
    } catch (_err) {
      // Fall back to legacy select → update/insert when upsert is unavailable.
    }
  }

  const { data: existing, error: selErr } = await auth.edgeClient.database
    .from('vibeusage_user_settings')
    .select('user_id')
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (selErr) return json({ error: selErr.message }, 500);

  if (existing?.user_id) {
    const { error: updErr } = await auth.edgeClient.database
      .from('vibeusage_user_settings')
      .update({ leaderboard_public: leaderboardPublic, updated_at: updatedAt })
      .eq('user_id', auth.userId);
    if (updErr) return json({ error: updErr.message }, 500);
  } else {
    const { error: insErr } = await auth.edgeClient.database
      .from('vibeusage_user_settings')
    .insert([upsertRow]);
    if (insErr) return json({ error: insErr.message }, 500);
  }

  await trySyncSnapshot({ baseUrl, userId: auth.userId, leaderboardPublic });
  return json({ leaderboard_public: leaderboardPublic, updated_at: updatedAt }, 200);
};

async function trySyncSnapshot({ baseUrl, userId, leaderboardPublic }) {
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) return;

  const anonKey = getAnonKey();
  const serviceClient = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken: serviceRoleKey
  });

  const now = new Date();
  const today = toUtcDay(now);
  const dow = today.getUTCDay(); // 0=Sunday
  const from = formatDateUTC(addUtcDays(today, -dow));
  const to = formatDateUTC(addUtcDays(today, -dow + 6));

  let nickname = null;
  let avatarUrl = null;
  try {
    const { data } = await serviceClient.database
      .from('users')
      .select('nickname,avatar_url')
      .eq('id', userId)
      .maybeSingle();
    nickname = typeof data?.nickname === 'string' ? data.nickname.trim() : null;
    avatarUrl = typeof data?.avatar_url === 'string' ? data.avatar_url.trim() : null;
  } catch (_err) {
    nickname = null;
    avatarUrl = null;
  }

  const displayName = leaderboardPublic && nickname ? nickname : 'Anonymous';
  const nextAvatarUrl = leaderboardPublic && avatarUrl ? avatarUrl : null;

  try {
    await serviceClient.database
      .from('vibeusage_leaderboard_snapshots')
      .update({ display_name: displayName, avatar_url: nextAvatarUrl })
      .eq('period', 'week')
      .eq('from_day', from)
      .eq('to_day', to)
      .eq('user_id', userId);
  } catch (_err) {
    // ignore sync errors
  }
}
