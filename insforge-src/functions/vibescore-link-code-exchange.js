// Edge function: vibescore-link-code-exchange
// Exchanges a link code for a long-lived device token.
//
// Auth:
// - No Authorization header (link code in body). Requires service role on server.

'use strict';

const { handleOptions, json, requireMethod, readJson } = require('../shared/http');
const { getBaseUrl, getAnonKey, getServiceRoleKey } = require('../shared/env');
const { sha256Hex } = require('../shared/crypto');

const EXCHANGE_ERROR_MESSAGE = 'Failed to exchange link code';

module.exports = async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'POST');
  if (methodErr) return methodErr;

  const body = await readJson(request);
  if (body.error) return json({ error: body.error }, body.status);

  const payload = body.data || {};
  const linkCode = sanitizeText(payload.link_code, 256);
  if (!linkCode) return json({ error: 'link_code is required' }, 400);

  const baseUrl = getBaseUrl();
  const serviceRoleKey = getServiceRoleKey();
  const anonKey = getAnonKey();
  if (!serviceRoleKey) {
    console.error('link code exchange missing service role key');
    return json({ error: EXCHANGE_ERROR_MESSAGE }, 500);
  }

  const serviceClient = createClient({
    baseUrl,
    anonKey: anonKey || serviceRoleKey,
    edgeFunctionToken: serviceRoleKey
  });

  const codeHash = await sha256Hex(linkCode);
  const { data: linkRow, error: linkErr } = await serviceClient.database
    .from('vibescore_tracker_link_codes')
    .select('id,user_id,expires_at,used_at')
    .eq('code_hash', codeHash)
    .maybeSingle();

  if (linkErr) return json({ error: EXCHANGE_ERROR_MESSAGE }, 500);
  if (!linkRow || isExpired(linkRow.expires_at) || linkRow.used_at) {
    return json({ error: 'Invalid or expired link code' }, 401);
  }

  const deviceName =
    sanitizeText(payload.device_name, 128) ||
    (Deno.env.get('HOSTNAME') ? `macOS (${Deno.env.get('HOSTNAME')})` : 'macOS');
  const platform = sanitizeText(payload.platform, 32) || 'macos';

  const deviceId = crypto.randomUUID();
  const tokenId = crypto.randomUUID();
  const token = generateToken();
  const tokenHash = await sha256Hex(token);

  const { error: deviceErr } = await serviceClient.database
    .from('vibescore_tracker_devices')
    .insert([
      {
        id: deviceId,
        user_id: linkRow.user_id,
        device_name: deviceName,
        platform
      }
    ]);

  if (deviceErr) {
    console.error(`link code exchange device insert failed: ${EXCHANGE_ERROR_MESSAGE}`);
    return json({ error: EXCHANGE_ERROR_MESSAGE }, 500);
  }

  const { error: tokenErr } = await serviceClient.database
    .from('vibescore_tracker_device_tokens')
    .insert([
      {
        id: tokenId,
        user_id: linkRow.user_id,
        device_id: deviceId,
        token_hash: tokenHash
      }
    ]);

  if (tokenErr) {
    await bestEffortDeleteDevice({ dbClient: serviceClient, deviceId, userId: linkRow.user_id });
    console.error(`link code exchange token insert failed: ${EXCHANGE_ERROR_MESSAGE}`);
    return json({ error: EXCHANGE_ERROR_MESSAGE }, 500);
  }

  const usedAt = new Date().toISOString();
  const { error: updateErr } = await serviceClient.database
    .from('vibescore_tracker_link_codes')
    .update({ used_at: usedAt, device_id: deviceId })
    .eq('id', linkRow.id);

  if (updateErr) {
    console.error(`link code exchange update failed: ${EXCHANGE_ERROR_MESSAGE}`);
    return json({ error: EXCHANGE_ERROR_MESSAGE }, 500);
  }

  return json(
    {
      device_id: deviceId,
      token,
      created_at: usedAt
    },
    200
  );
};

function sanitizeText(value, maxLen) {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (s.length === 0) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function isExpired(expiresAt) {
  if (!expiresAt) return true;
  const ts = Date.parse(expiresAt);
  if (!Number.isFinite(ts)) return true;
  return ts <= Date.now();
}

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

async function bestEffortDeleteDevice({ dbClient, deviceId, userId }) {
  try {
    let query = dbClient.database.from('vibescore_tracker_devices').delete().eq('id', deviceId);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) {
      console.error(`link code exchange compensation delete failed: ${EXCHANGE_ERROR_MESSAGE}`);
    }
  } catch (_err) {
    console.error(`link code exchange compensation delete threw: ${EXCHANGE_ERROR_MESSAGE}`);
  }
}
