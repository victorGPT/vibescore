'use strict';

const { getAnonKey, getServiceRoleKey } = require('./env');
const { sha256Hex } = require('./crypto');

const SHARE_TOKEN_RE = /^[a-f0-9]{64}$/;

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

  const tokenHash = await sha256Hex(token);
  const { data, error } = await dbClient.database
    .from('vibeusage_public_views')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data?.user_id) {
    return { ok: false, edgeClient: null, userId: null };
  }

  const { data: settings, error: settingsErr } = await dbClient.database
    .from('vibeusage_user_settings')
    .select('leaderboard_public')
    .eq('user_id', data.user_id)
    .maybeSingle();

  // Unified visibility: public share tokens are valid only when the owner has enabled public profile.
  if (settingsErr || settings?.leaderboard_public !== true) {
    return { ok: false, edgeClient: null, userId: null };
  }

  return { ok: true, edgeClient: dbClient, userId: data.user_id };
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
  if (!SHARE_TOKEN_RE.test(normalized)) return null;
  return normalized;
}

function isPublicShareToken(value) {
  return Boolean(normalizeShareToken(value));
}

module.exports = {
  resolvePublicView,
  isPublicShareToken
};
