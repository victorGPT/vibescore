// Edge function: vibeusage-public-view-profile
// Returns a privacy-safe display name for a public share token.

'use strict';

const { handleOptions, json, requireMethod } = require('../shared/http');
const { getBearerToken } = require('../shared/auth');
const { resolvePublicView } = require('../shared/public-view');
const { getBaseUrl } = require('../shared/env');
const { withRequestLogging } = require('../shared/logging');

module.exports = withRequestLogging('vibeusage-public-view-profile', async function(request) {
  const opt = handleOptions(request);
  if (opt) return opt;

  const methodErr = requireMethod(request, 'GET');
  if (methodErr) return methodErr;

  const bearer = getBearerToken(request.headers.get('Authorization'));
  if (!bearer) return json({ error: 'Missing bearer token' }, 401);

  const baseUrl = getBaseUrl();
  const publicView = await resolvePublicView({ baseUrl, shareToken: bearer });
  if (!publicView.ok) return json({ error: 'Unauthorized' }, 401);

  const { data, error } = await publicView.edgeClient.database
    .from('users')
    .select('nickname,avatar_url,profile,metadata')
    .eq('id', publicView.userId)
    .maybeSingle();

  if (error) return json({ error: 'Failed to fetch public profile' }, 500);

  const displayName = resolveDisplayName(data);
  const avatarUrl = resolveAvatarUrl(data);
  return json({ display_name: displayName, avatar_url: avatarUrl }, 200);
});

function resolveDisplayName(row) {
  const profile = isObject(row?.profile) ? row.profile : null;
  const metadata = isObject(row?.metadata) ? row.metadata : null;

  return (
    sanitizeName(row?.nickname) ||
    sanitizeName(profile?.name) ||
    sanitizeName(profile?.full_name) ||
    sanitizeName(metadata?.full_name) ||
    sanitizeName(metadata?.name) ||
    null
  );
}

function resolveAvatarUrl(row) {
  const profile = isObject(row?.profile) ? row.profile : null;
  const metadata = isObject(row?.metadata) ? row.metadata : null;

  return (
    sanitizeAvatarUrl(row?.avatar_url) ||
    sanitizeAvatarUrl(profile?.avatar_url) ||
    sanitizeAvatarUrl(metadata?.avatar_url) ||
    sanitizeAvatarUrl(metadata?.picture) ||
    null
  );
}

function sanitizeName(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) return null;
  if (trimmed.length > 128) return trimmed.slice(0, 128);
  return trimmed;
}

function sanitizeAvatarUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 1024) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch (_e) {
    return null;
  }
}

function isObject(value) {
  return Boolean(value && typeof value === 'object');
}
