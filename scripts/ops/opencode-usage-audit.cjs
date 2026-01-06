#!/usr/bin/env node
'use strict';

const os = require('node:os');
const path = require('node:path');

const { beginBrowserAuth, openInBrowser } = require('../../src/lib/browser-auth');
const { auditOpencodeUsage } = require('../../src/lib/opencode-usage-audit');

const DEFAULT_BASE_URL = 'https://5tmappuk.us-east.insforge.app';

function parseArgs(argv) {
  const out = {
    from: null,
    to: null,
    storageDir: null,
    baseUrl: null,
    noOpen: false,
    includeMissing: false,
    limit: 10
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from') out.from = argv[++i];
    else if (arg === '--to') out.to = argv[++i];
    else if (arg === '--storage-dir') out.storageDir = argv[++i];
    else if (arg === '--base-url') out.baseUrl = argv[++i];
    else if (arg === '--no-open') out.noOpen = true;
    else if (arg === '--include-missing') out.includeMissing = true;
    else if (arg === '--limit') out.limit = Number(argv[++i] || 10);
  }
  if (!Number.isFinite(out.limit) || out.limit <= 0) out.limit = 10;
  return out;
}

function resolveStorageDir(env) {
  const home = os.homedir();
  const explicit = typeof env.OPENCODE_STORAGE_DIR === 'string' ? env.OPENCODE_STORAGE_DIR.trim() : '';
  if (explicit) return path.resolve(explicit);
  const opencodeHome = typeof env.OPENCODE_HOME === 'string' ? env.OPENCODE_HOME.trim() : '';
  if (opencodeHome) return path.resolve(opencodeHome, 'storage');
  const xdg = typeof env.XDG_DATA_HOME === 'string' ? env.XDG_DATA_HOME.trim() : '';
  const base = xdg || path.join(home, '.local', 'share');
  return path.join(base, 'opencode', 'storage');
}

async function resolveAccessToken({ env, baseUrl, noOpen, log }) {
  const token = env.VIBEUSAGE_ACCESS_TOKEN || env.VIBESCORE_ACCESS_TOKEN || '';
  if (token) return token;
  const flow = await beginBrowserAuth({ baseUrl, timeoutMs: 10 * 60_000, open: false });
  if (noOpen) {
    log(`Open this URL to authenticate: ${flow.authUrl}`);
  } else {
    openInBrowser(flow.authUrl);
  }
  const callback = await flow.waitForCallback();
  return callback.accessToken;
}

async function fetchUsageHourly({ baseUrl, accessToken, day }) {
  const url = new URL('/functions/vibeusage-usage-hourly', baseUrl);
  url.searchParams.set('day', day);
  url.searchParams.set('source', 'opencode');
  url.searchParams.set('tz', 'UTC');
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`usage-hourly failed: HTTP ${res.status}`);
  return res.json();
}

async function runAuditCli(argv, deps = {}) {
  const env = deps.env || process.env;
  const log = deps.log || console.log;
  const error = deps.error || console.error;
  const audit = deps.audit || auditOpencodeUsage;

  const args = parseArgs(argv);
  const baseUrl =
    args.baseUrl ||
    env.VIBEUSAGE_INSFORGE_BASE_URL ||
    env.VIBESCORE_INSFORGE_BASE_URL ||
    DEFAULT_BASE_URL;
  const storageDir = args.storageDir || resolveStorageDir(env);
  const accessToken = await resolveAccessToken({ env, baseUrl, noOpen: args.noOpen, log });

  const fetchHourly = (day) => fetchUsageHourly({ baseUrl, accessToken, day });
  const result = await audit({
    storageDir,
    from: args.from,
    to: args.to,
    fetchHourly,
    includeMissing: args.includeMissing
  });

  log(
    `days=${result.summary.days} slots=${result.summary.slots} matched=${result.summary.matched} ` +
      `mismatched=${result.summary.mismatched} incomplete=${result.summary.incomplete} ` +
      `max_delta=${result.summary.maxDelta}`
  );

  if (result.diffs.length) {
    const top = result.diffs.slice(0, args.limit);
    for (const row of top) {
      log(
        `${row.hour} local=${row.local.total_tokens} server=${row.server.total_tokens} ` +
          `delta=${row.delta.total_tokens}`
      );
    }
  }

  return result.summary.mismatched > 0 ? 2 : 0;
}

if (require.main === module) {
  runAuditCli(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err?.message || err);
      process.exit(1);
    });
}

module.exports = { runAuditCli };
