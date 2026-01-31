'use strict';

const { getAnonKey, getJwtSecret } = require('./env');
const { resolvePublicView, isPublicShareToken } = require('./public-view');

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

function decodeJwtHeader(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const raw = decodeBase64Url(parts[0]);
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

function base64UrlEncode(value) {
  let base64 = null;
  try {
    if (typeof Buffer !== 'undefined') {
      base64 = Buffer.from(value).toString('base64');
    }
  } catch (_e) {
    // ignore
  }
  if (!base64 && typeof btoa === 'function' && value instanceof ArrayBuffer) {
    const bytes = new Uint8Array(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    base64 = btoa(binary);
  }
  if (!base64) return null;
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function verifyUserJwtHs256({ token }) {
  const secret = getJwtSecret();
  if (!secret) {
    return { ok: false, userId: null, error: 'Missing jwt secret', code: 'missing_jwt_secret' };
  }
  if (typeof token !== 'string') {
    return { ok: false, userId: null, error: 'Invalid token' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { ok: false, userId: null, error: 'Invalid token' };
  }
  const header = decodeJwtHeader(token);
  if (!header || header.alg !== 'HS256') {
    return { ok: false, userId: null, error: 'Unsupported alg' };
  }
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { ok: false, userId: null, error: 'Invalid payload' };
  }
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) {
    return { ok: false, userId: null, error: 'Missing exp' };
  }
  if (isJwtExpired(payload)) {
    return { ok: false, userId: null, error: 'Token expired' };
  }
  const cryptoSubtle = globalThis.crypto?.subtle;
  if (!cryptoSubtle) {
    return { ok: false, userId: null, error: 'Crypto unavailable' };
  }
  const data = `${parts[0]}.${parts[1]}`;
  const encoder = new TextEncoder();
  const key = await cryptoSubtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoSubtle.sign('HMAC', key, encoder.encode(data));
  const expected = base64UrlEncode(signature);
  if (!expected || expected !== parts[2]) {
    return { ok: false, userId: null, error: 'Invalid signature' };
  }
  const userId = typeof payload.sub === 'string' ? payload.sub : null;
  if (!userId) {
    return { ok: false, userId: null, error: 'Missing sub' };
  }
  return { ok: true, userId, error: null };
}

async function getEdgeClientAndUserId({ baseUrl, bearer }) {
  const auth = await getEdgeClientAndUserIdFast({ baseUrl, bearer });
  if (!auth.ok) return { ok: false, edgeClient: null, userId: null };
  return { ok: true, edgeClient: auth.edgeClient, userId: auth.userId };
}

async function getEdgeClientAndUserIdFast({ baseUrl, bearer }) {
  const anonKey = getAnonKey();
  const edgeClient = createClient({ baseUrl, anonKey: anonKey || undefined, edgeFunctionToken: bearer });
  const local = await verifyUserJwtHs256({ token: bearer });
  const allowAuthOnly = !local.ok && local.code === 'missing_jwt_secret';
  if (!local.ok && !allowAuthOnly) {
    return { ok: false, edgeClient: null, userId: null, error: local };
  }

  if (typeof edgeClient?.auth?.getCurrentUser !== 'function') {
    return {
      ok: false,
      edgeClient: null,
      userId: null,
      error: { error: 'Auth client unavailable', code: 'missing_auth_client' }
    };
  }

  let authResult = null;
  try {
    authResult = await edgeClient.auth.getCurrentUser();
  } catch (e) {
    return {
      ok: false,
      edgeClient: null,
      userId: null,
      error: { error: e?.message || 'Auth lookup failed', code: 'auth_lookup_failed' }
    };
  }

  const authUserId = authResult?.data?.user?.id || null;
  if (!authUserId || authResult?.error) {
    return {
      ok: false,
      edgeClient: null,
      userId: null,
      error: { error: authResult?.error?.message || 'Auth lookup failed', code: 'auth_lookup_failed' }
    };
  }

  if (!allowAuthOnly && authUserId !== local.userId) {
    return {
      ok: false,
      edgeClient: null,
      userId: null,
      error: { error: 'User mismatch', code: 'user_mismatch' }
    };
  }

  return { ok: true, edgeClient, userId: authUserId };
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

  if (!isPublicShareToken(bearer)) {
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
  isProjectAdminBearer,
  verifyUserJwtHs256
};
