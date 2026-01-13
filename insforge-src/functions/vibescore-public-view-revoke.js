// Edge function: vibescore-public-view-revoke
// Revokes the current public dashboard share token for the authenticated user.

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { withRequestLogging } = require('../shared/logging');

module.exports = withRequestLogging('vibescore-public-view-revoke', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'POST');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401);

  const nowIso = new Date().toISOString();
  const { error } = await auth.edgeClient.database
    .from('vibescore_public_views')
    .update({ revoked_at: nowIso, updated_at: nowIso })
    .eq('user_id', auth.userId);

  if (error) return json({ error: 'Failed to revoke public view link' }, 500);
  return json({ enabled: false }, 200);
});
