// Edge function: vibescore-link-code-issue
// Issues a short-lived link code for device token bootstrap.
//
// Auth:
// - Authorization: Bearer <user_jwt>

'use strict';

const { handleOptions, json, requireMethod, readJson } = require('../shared/http');
const { getBearerToken, getEdgeClientAndUserId } = require('../shared/auth');
const { getBaseUrl } = require('../shared/env');
const { sha256Hex } = require('../shared/crypto');

const ISSUE_ERROR_MESSAGE = 'Failed to issue link code';
const LINK_CODE_TTL_MS = 10 * 60_000;

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'POST');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const body = await readJson(request);
  if (body.error) return json({ error: body.error }, body.status);

  const baseUrl = getBaseUrl();
  const auth = await getEdgeClientAndUserId({ baseUrl, bearer });
  if (!auth.ok) return json({ error: 'Unauthorized' }, 401);

  const userId = auth.userId;
  const dbClient = auth.edgeClient;

  const linkCode = generateLinkCode();
  const codeHash = await sha256Hex(linkCode);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LINK_CODE_TTL_MS).toISOString();

  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    code_hash: codeHash,
    expires_at: expiresAt
  };

  const { error: insertErr } = await dbClient.database
    .from('vibescore_tracker_link_codes')
    .insert([row]);

  if (insertErr) {
    console.error(`link code issue insert failed: ${ISSUE_ERROR_MESSAGE}`);
    return json({ error: ISSUE_ERROR_MESSAGE }, 500);
  }

  return json(
    {
      link_code: linkCode,
      expires_at: expiresAt
    },
    200
  );
};

function generateLinkCode() {
  return crypto.randomUUID().replace(/-/g, '');
}
