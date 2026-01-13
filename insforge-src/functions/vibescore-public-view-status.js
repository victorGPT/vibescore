// Edge function: vibescore-public-view-status
// Returns whether the authenticated user has an active public dashboard share token.

'use strict';

const { handleOptions, json } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { withRequestLogging } = require('../shared/logging');

module.exports = withRequestLogging('vibescore-public-view-status', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401);

  const { data, error } = await auth.edgeClient.database
    .from('vibescore_public_views')
    .select('revoked_at')
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (error) return json({ error: 'Failed to fetch public view status' }, 500);

  const enabled = Boolean(data && !data.revoked_at);
  return json({ enabled }, 200);
});
