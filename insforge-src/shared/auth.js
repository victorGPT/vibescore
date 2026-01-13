'use strict';

const { getAnonKey } = require('./env');
const { resolvePublicView } = require('./public-view');

function getBearerToken(headerValue) {
  if (!headerValue) return null;
  const prefix = 'Bearer ';
  if (!headerValue.startsWith(prefix)) return null;
  const token = headerValue.slice(prefix.length).trim();
  return token.length > 0 ? token : null;
}

function decodeBase64Url(value) {
  if (typeof value !== 'string') return null;
  let s = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4;
  if (pad) s += '='.repeat(4 - pad);
  try {
    if (typeof atob === 'function') return atob(s);
  } catch (_e) {
    // fall through
  }
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(s, 'base64').toString('utf8');
    }
  } catch (_e) {
    // ignore
  }
  return null;
}

function decodeJwtPayload(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const raw = decodeBase64Url(parts[1]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

function getJwtRole(token) {
  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  if (typeof role === 'string' && role.length > 0) return role;
  const appRole = payload?.app_metadata?.role;
  if (typeof appRole === 'string' && appRole.length > 0) return appRole;
  const roles = payload?.app_metadata?.roles;
  if (Array.isArray(roles)) {
    if (roles.includes('project_admin')) return 'project_admin';
    const match = roles.find((value) => typeof value === 'string' && value.length > 0);
    if (match) return match;
  }
  return null;
}

function isProjectAdminBearer(token) {
  const role = getJwtRole(token);
  return role === 'project_admin';
}

function isJwtExpired(payload) {
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return false;
  return exp * 1000 <= Date.now();
}

async function getEdgeClientAndUserId({ baseUrl, bearer }) {
  const anonKey = getAnonKey();
  const edgeClient = createClient({ baseUrl, anonKey: anonKey || undefined, edgeFunctionToken: bearer });
  const { data: userData, error: userErr } = await edgeClient.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (userErr || !userId) return { ok: false, edgeClient: null, userId: null };
  return { ok: true, edgeClient, userId };
}

async function getEdgeClientAndUserIdFast({ baseUrl, bearer }) {
  const anonKey = getAnonKey();
  const edgeClient = createClient({ baseUrl, anonKey: anonKey || undefined, edgeFunctionToken: bearer });
  const payload = decodeJwtPayload(bearer);
  if (payload && isJwtExpired(payload)) {
    return { ok: false, edgeClient: null, userId: null };
  }
  const { data: userData, error: userErr } = await edgeClient.auth.getCurrentUser();
  const resolvedUserId = userData?.user?.id;
  if (userErr || !resolvedUserId) return { ok: false, edgeClient: null, userId: null };
  return { ok: true, edgeClient, userId: resolvedUserId };
}

async function getAccessContext({ baseUrl, bearer, allowPublic = false }) {
  if (!bearer) return { ok: false, edgeClient: null, userId: null, accessType: null };

  const auth = await getEdgeClientAndUserIdFast({ baseUrl, bearer });
  if (auth.ok) {
    return { ok: true, edgeClient: auth.edgeClient, userId: auth.userId, accessType: 'user' };
  }
  if (!allowPublic) {
    return { ok: false, edgeClient: null, userId: null, accessType: null };
  }

  const publicView = await resolvePublicView({ baseUrl, shareToken: bearer });
  if (!publicView.ok) {
    return { ok: false, edgeClient: null, userId: null, accessType: null };
  }
  return {
    ok: true,
    edgeClient: publicView.edgeClient,
    userId: publicView.userId,
    accessType: 'public'
  };
}

module.exports = {
  getBearerToken,
  getAccessContext,
  getEdgeClientAndUserId,
  getEdgeClientAndUserIdFast,
  isProjectAdminBearer
};
