'use strict';

const DEFAULT_LIMIT = 3;

function buildRequestUrl({ baseUrl, limit } = {}) {
  if (!baseUrl) throw new Error('baseUrl is required');
  const url = new URL('/functions/vibeusage-project-usage-summary', baseUrl);
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.floor(Number(limit))) : DEFAULT_LIMIT;
  url.searchParams.set('limit', String(safeLimit));
  return url.toString();
}

function getConfigFromEnv(env) {
  const baseUrl = env?.VIBEUSAGE_INSFORGE_BASE_URL || '';
  const token = env?.VIBEUSAGE_USER_JWT || '';
  const limitRaw = env?.VIBEUSAGE_PROJECT_USAGE_LIMIT;
  const limit = Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : DEFAULT_LIMIT;
  if (!baseUrl) return { ok: false, error: 'Missing VIBEUSAGE_INSFORGE_BASE_URL' };
  if (!token) return { ok: false, error: 'Missing VIBEUSAGE_USER_JWT' };
  return { ok: true, baseUrl, token, limit };
}

async function runSmoke({ baseUrl, token, limit, fetchImpl, logger } = {}) {
  const log = logger || console;
  if (!baseUrl) return { ok: false, status: null, error: 'baseUrl is required' };
  if (!token) return { ok: false, status: null, error: 'token is required' };
  const url = buildRequestUrl({ baseUrl, limit });
  const fetcher = fetchImpl || fetch;
  let res = null;
  try {
    res = await fetcher(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    return { ok: false, status: null, error: err?.message || 'fetch failed' };
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch (_err) {
    payload = null;
  }

  if (!res.ok) {
    const text = payload?.error ? String(payload.error) : await safeReadText(res);
    log.error(`smoke failed: status=${res.status} error=${text || 'unknown'}`);
    return { ok: false, status: res.status, error: text || 'unknown' };
  }

  const entries = Array.isArray(payload?.entries) ? payload.entries : null;
  if (!entries) {
    log.error('smoke failed: invalid response payload');
    return { ok: false, status: res.status, error: 'invalid response payload' };
  }

  log.info(`smoke ok: entries=${entries.length}`);
  return { ok: true, status: res.status, entries };
}

async function safeReadText(res) {
  if (!res || typeof res.text !== 'function') return null;
  try {
    return await res.text();
  } catch (_err) {
    return null;
  }
}

async function main() {
  const config = getConfigFromEnv(process.env);
  if (!config.ok) {
    console.error(config.error);
    process.exit(1);
    return;
  }
  const result = await runSmoke({
    baseUrl: config.baseUrl,
    token: config.token,
    limit: config.limit,
    fetchImpl: fetch,
    logger: console
  });
  process.exit(result.ok ? 0 : 1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  });
}

module.exports = {
  buildRequestUrl,
  getConfigFromEnv,
  runSmoke
};
