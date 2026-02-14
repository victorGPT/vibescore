'use strict';

const { getAnonKey, getServiceRoleKey } = require('./env');

const PUBLIC_USER_TOKEN_RE = /^pv1-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

async function resolvePublicView({ baseUrl, shareToken }) {
  const token = normalizeShareToken(shareToken);
  if (!token) {
    return { ok: false, edgeClient: null, userId: null };
  }

  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) return { ok: false, edgeClient: null, userId: null };

  const anonKey = getAnonKey();
  const dbClient = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken: serviceRoleKey
  });

  const resolvedUserId = await resolvePublicUserId({ dbClient, token });
  if (!resolvedUserId) {
    return { ok: false, edgeClient: null, userId: null };
  }

  const { data: settings, error: settingsErr } = await dbClient.database
    .from('vibeusage_user_settings')
    .select('leaderboard_public')
    .eq('user_id', resolvedUserId)
    .maybeSingle();

  if (settingsErr || settings?.leaderboard_public !== true) {
    return { ok: false, edgeClient: null, userId: null };
  }

  return { ok: true, edgeClient: dbClient, userId: resolvedUserId };
}

async function resolvePublicUserId({ dbClient, token }) {
  if (!dbClient || !token) return null;

  const { data, error } = await dbClient.database
    .from('vibeusage_public_views')
    .select('user_id')
    .eq('user_id', token.userId)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data?.user_id) return null;
  return data.user_id;
}

function normalizeToken(value) {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (!token) return null;
  if (token.length > 256) return null;
  return token;
}

function normalizeShareToken(value) {
  const token = normalizeToken(value);
  if (!token) return null;
  const normalized = token.toLowerCase();
  if (token !== normalized) return null;

  const publicUserMatch = normalized.match(PUBLIC_USER_TOKEN_RE);
  if (publicUserMatch?.[1]) {
    return { kind: 'user', userId: publicUserMatch[1] };
  }

  return null;
}

function isPublicShareToken(value) {
  return Boolean(normalizeShareToken(value));
}

module.exports = {
  resolvePublicView,
  isPublicShareToken
};
