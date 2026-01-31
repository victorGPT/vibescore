// Edge function: vibeusage-debug-auth
// Diagnostic endpoint to confirm runtime auth prerequisites (no secrets).

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken, verifyUserJwtHs256 } = require('../shared/auth');
const { getAnonKey } = require('../shared/env');

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

  const local = await verifyUserJwtHs256({ token: bearer });
  const authOk = local.ok;
  const userId = local.userId;
  const error = local.ok ? null : local.error || 'Unauthorized';

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
