'use strict';

const { getAnonKey, getServiceRoleKey } = require('./env');
const { sha256Hex } = require('./crypto');

async function resolvePublicView({ baseUrl, shareToken }) {
  const token = normalizeToken(shareToken);
  if (!token) return { ok: false, edgeClient: null, userId: null };

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
    .from('vibescore_public_views')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data?.user_id) {
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

module.exports = {
  resolvePublicView
};
