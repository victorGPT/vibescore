// Edge function: vibeusage-debug-auth
// Diagnostic endpoint to confirm runtime auth prerequisites (no secrets).

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken } = require('../shared/auth');
const { getAnonKey, getBaseUrl } = require('../shared/env');

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'GET');
  if (methodErr) return methodErr;

  const anonKey = getAnonKey();
  const bearer = getBearerToken(request.headers.get('Authorization'));

  if (!anonKey) {
    return json(
      {
        hasAnonKey: false,
        hasBearer: Boolean(bearer),
        authOk: false,
        userId: null,
        error: 'Missing anon key'
      },
      200
    );
  }

  if (!bearer) {
    return json(
      {
        hasAnonKey: true,
        hasBearer: false,
        authOk: false,
        userId: null,
        error: 'Missing bearer token'
      },
      200
    );
  }

  const baseUrl = getBaseUrl();
  let authOk = false;
  let userId = null;
  let error = null;

  try {
    const edgeClient = createClient({
      baseUrl,
      anonKey,
      edgeFunctionToken: bearer
    });
    const { data, error: authError } = await edgeClient.auth.getCurrentUser();
    userId = data?.user?.id || null;
    authOk = Boolean(userId) && !authError;
    if (!authOk) {
      error = authError?.message || 'Unauthorized';
    }
  } catch (e) {
    error = e?.message || String(e);
  }

  return json(
    {
      hasAnonKey: true,
      hasBearer: true,
      authOk,
      userId,
      error
    },
    200
  );
};
