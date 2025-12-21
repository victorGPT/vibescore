// Edge function: vibescore-debug-auth
// Diagnostic endpoint to confirm runtime auth prerequisites (no secrets).

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getAnonKey } = require('../shared/env');

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'GET');
  if (methodErr) return methodErr;

  const anonKey = getAnonKey();

  return json(
    {
      hasAnonKey: Boolean(anonKey)
    },
    200
  );
};
