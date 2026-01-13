// Edge function: vibescore-public-view-issue
// Issues or rotates a public dashboard share token for the authenticated user.

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { sha256Hex } = require('../shared/crypto');
const { withRequestLogging } = require('../shared/logging');

module.exports = withRequestLogging('vibescore-public-view-issue', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'POST');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401);

  const shareToken = generateShareToken();
  const tokenHash = await sha256Hex(shareToken);
  const nowIso = new Date().toISOString();
  const nextRow = {
    user_id: auth.userId,
    token_hash: tokenHash,
    revoked_at: null,
    updated_at: nowIso
  };

  const table = auth.edgeClient.database.from('vibescore_public_views');
  if (typeof table.upsert === 'function') {
    try {
      const { error: upsertErr } = await table.upsert([nextRow], { onConflict: 'user_id' });
      if (!upsertErr) {
        return json({ enabled: true, share_token: shareToken }, 200);
      }
    } catch (_err) {
      // Fall back to legacy select → update/insert when upsert is unavailable.
    }
  }

  const { data: existing, error: selectErr } = await table
    .select('user_id')
    .eq('user_id', auth.userId)
    .maybeSingle();
  if (selectErr) return json({ error: 'Failed to issue public view link' }, 500);

  if (existing?.user_id) {
    const { error: updateErr } = await table
      .update({ token_hash: tokenHash, revoked_at: null, updated_at: nowIso })
      .eq('user_id', auth.userId);
    if (updateErr) return json({ error: 'Failed to issue public view link' }, 500);
  } else {
    const { error: insertErr } = await table.insert([nextRow]);
    if (insertErr) return json({ error: 'Failed to issue public view link' }, 500);
  }

  return json({ enabled: true, share_token: shareToken }, 200);
});

function generateShareToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}
