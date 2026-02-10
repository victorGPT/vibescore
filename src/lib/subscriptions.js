const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const cp = require('node:child_process');

const { readJson } = require('./fs');

const OPENAI_AUTH_CLAIM = 'https://api.openai.com/auth';
const MACOS_SECURITY_BIN = '/usr/bin/security';
const CLAUDE_CODE_KEYCHAIN_SERVICES = ['Claude Code-credentials'];

function normalizeString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeScalarToString(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return normalizeString(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return normalizeString(String(value));
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return null;
}

function base64UrlDecodeToString(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const padLen = (4 - (value.length % 4)) % 4;
  const padded = value + '='.repeat(padLen);
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(base64, 'base64').toString('utf8');
  } catch (_e) {
    return null;
  }
}

function decodeJwtPayload(token) {
  const jwt = normalizeString(token);
  if (!jwt) return null;
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  const decoded = base64UrlDecodeToString(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch (_e) {
    return null;
  }
}

function extractOpenAiAuthNamespace(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const ns = payload[OPENAI_AUTH_CLAIM];
  if (!ns || typeof ns !== 'object' || Array.isArray(ns)) return null;
  return ns;
}

function extractChatgptSubscriptionFromPayload(payload) {
  const ns = extractOpenAiAuthNamespace(payload);
  if (!ns) return null;

  const planType = normalizeString(ns.chatgpt_plan_type);
  const activeStart = normalizeString(ns.chatgpt_subscription_active_start);
  const activeUntil = normalizeString(ns.chatgpt_subscription_active_until);
  const lastChecked = normalizeString(ns.chatgpt_subscription_last_checked);

  if (!planType && !activeStart && !activeUntil && !lastChecked) return null;
  return { planType, activeStart, activeUntil, lastChecked };
}

function mergeSubscription(primary, secondary) {
  if (!primary && !secondary) return null;
  const a = primary || {};
  const b = secondary || {};
  return {
    planType: a.planType || b.planType || null,
    activeStart: a.activeStart || b.activeStart || null,
    activeUntil: a.activeUntil || b.activeUntil || null,
    lastChecked: a.lastChecked || b.lastChecked || null
  };
}

function isDisplayablePlanType(planType) {
  const normalized = normalizeString(planType);
  if (!normalized) return false;
  const v = normalized.toLowerCase();
  if (v === 'free' || v === 'none' || v === 'unknown') return false;
  return true;
}

function resolveCodexHome({ home, env }) {
  const explicit = normalizeString(env?.CODEX_HOME);
  return explicit ? path.resolve(explicit) : path.join(home, '.codex');
}

function resolveOpencodeDataDir({ home, env }) {
  const explicit = normalizeString(env?.XDG_DATA_HOME);
  const base = explicit ? path.resolve(explicit) : path.join(home, '.local', 'share');
  return path.join(base, 'opencode');
}

async function detectCodexChatgptSubscription({ home, env }) {
  const codexHome = resolveCodexHome({ home, env });
  const authPath = path.join(codexHome, 'auth.json');
  const auth = await readJson(authPath);
  if (!auth || typeof auth !== 'object') return null;

  const accessPayload = decodeJwtPayload(auth?.tokens?.access_token);
  const idPayload = decodeJwtPayload(auth?.tokens?.id_token);

  const accessInfo = extractChatgptSubscriptionFromPayload(accessPayload);
  const idInfo = extractChatgptSubscriptionFromPayload(idPayload);
  const merged = mergeSubscription(accessInfo, idInfo);
  if (!merged || !isDisplayablePlanType(merged.planType)) return null;

  return {
    tool: 'codex',
    provider: 'openai',
    product: 'chatgpt',
    planType: merged.planType,
    activeStart: merged.activeStart,
    activeUntil: merged.activeUntil,
    lastChecked: merged.lastChecked
  };
}

async function detectOpencodeChatgptSubscription({ home, env }) {
  const dataDir = resolveOpencodeDataDir({ home, env });
  const authPath = path.join(dataDir, 'auth.json');
  const auth = await readJson(authPath);
  if (!auth || typeof auth !== 'object') return null;

  const accessPayload = decodeJwtPayload(auth?.openai?.access);
  const info = extractChatgptSubscriptionFromPayload(accessPayload);
  if (!info || !isDisplayablePlanType(info.planType)) return null;

  return {
    tool: 'opencode',
    provider: 'openai',
    product: 'chatgpt',
    planType: info.planType,
    activeStart: info.activeStart,
    activeUntil: info.activeUntil,
    lastChecked: info.lastChecked
  };
}

function probeMacosKeychainGenericPassword({
  service,
  securityRunner,
  timeoutMs
} = {}) {
  const svc = normalizeString(service);
  if (!svc) return false;

  const runner = typeof securityRunner === 'function' ? securityRunner : cp.spawnSync;
  if (runner === cp.spawnSync && !fs.existsSync(MACOS_SECURITY_BIN)) return false;

  const result = runner(
    MACOS_SECURITY_BIN,
    ['find-generic-password', '-s', svc],
    {
      stdio: 'ignore',
      timeout: Number.isFinite(timeoutMs) ? timeoutMs : 2000
    }
  );

  if (!result || result.error) return false;
  return result.status === 0;
}

function readMacosKeychainPassword({
  service,
  securityRunner,
  timeoutMs
} = {}) {
  const svc = normalizeString(service);
  if (!svc) return null;

  const runner = typeof securityRunner === 'function' ? securityRunner : cp.spawnSync;
  if (runner === cp.spawnSync && !fs.existsSync(MACOS_SECURITY_BIN)) return null;

  const result = runner(
    MACOS_SECURITY_BIN,
    ['find-generic-password', '-s', svc, '-w'],
    {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: Number.isFinite(timeoutMs) ? timeoutMs : 2000,
      encoding: 'utf8'
    }
  );

  if (!result || result.error) return null;
  if (result.status !== 0) return null;

  const stdout =
    typeof result.stdout === 'string'
      ? result.stdout
      : Buffer.isBuffer(result.stdout)
        ? result.stdout.toString('utf8')
        : '';
  const trimmed = stdout.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function detectClaudeCodeCredentialsPresence({
  platform,
  securityRunner
} = {}) {
  if (platform !== 'darwin') return null;

  for (const service of CLAUDE_CODE_KEYCHAIN_SERVICES) {
    const present = probeMacosKeychainGenericPassword({
      service,
      securityRunner
    });
    if (!present) continue;

    // Existence-only probe: do not read secrets or infer paid tier.
    return {
      tool: 'claude',
      provider: 'anthropic',
      product: 'credentials',
      planType: 'present'
    };
  }

  return null;
}

function extractClaudeKeychainSubscription(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

  const oauth = payload.claudeAiOauth;
  if (!oauth || typeof oauth !== 'object' || Array.isArray(oauth)) return null;

  const subscriptionType = normalizeScalarToString(oauth.subscriptionType);
  const rateLimitTier = normalizeScalarToString(oauth.rateLimitTier);

  if (!subscriptionType) return null;
  return { subscriptionType, rateLimitTier };
}

function detectClaudeCodeSubscriptionDetails({
  platform,
  securityRunner
} = {}) {
  if (platform !== 'darwin') return null;

  for (const service of CLAUDE_CODE_KEYCHAIN_SERVICES) {
    const raw = readMacosKeychainPassword({
      service,
      securityRunner
    });
    if (!raw) continue;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (_e) {
      continue;
    }

    const info = extractClaudeKeychainSubscription(payload);
    if (!info) continue;

    return {
      tool: 'claude',
      provider: 'anthropic',
      product: 'subscription',
      planType: info.subscriptionType,
      rateLimitTier: info.rateLimitTier
    };
  }

  return null;
}

async function collectLocalSubscriptions({
  home = os.homedir(),
  env = process.env,
  platform = process.platform,
  securityRunner,
  probeKeychain = false,
  probeKeychainDetails = false
} = {}) {
  const out = [];

  const codex = await detectCodexChatgptSubscription({ home, env });
  if (codex) out.push(codex);

  const opencode = await detectOpencodeChatgptSubscription({ home, env });
  if (opencode) out.push(opencode);

  if (probeKeychainDetails) {
    const claude = detectClaudeCodeSubscriptionDetails({ platform, securityRunner });
    if (claude) out.push(claude);
    else if (probeKeychain) {
      const present = detectClaudeCodeCredentialsPresence({ platform, securityRunner });
      if (present) out.push(present);
    }
  } else if (probeKeychain) {
    const claude = detectClaudeCodeCredentialsPresence({ platform, securityRunner });
    if (claude) out.push(claude);
  }

  // Gemini: no stable local subscription/tier signal found yet.
  return out;
}

module.exports = {
  collectLocalSubscriptions
};
