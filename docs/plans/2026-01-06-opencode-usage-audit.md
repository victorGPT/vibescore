# Opencode Usage Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Legacy naming:** This plan predates the VibeUsage rename. References to `vibescore-usage-*` and related paths map to `vibeusage-usage-*` after the rename is finalized.

**Goal:** Build a local-to-server audit script that verifies Opencode token usage without service role access.

**Architecture:** Add a core audit module that aggregates local Opencode message totals into half-hour buckets and compares them with `vibescore-usage-hourly` results. Provide a CLI wrapper in `scripts/ops/` that handles auth, args, and output.

**Tech Stack:** Node.js (CommonJS), existing rollout parser (`src/lib/rollout.js`), fetch.

---

### Task 1: Core audit module + unit tests

**Files:**
- Create: `src/lib/opencode-usage-audit.js`
- Create: `test/opencode-usage-audit.test.js`

**Step 1: Write the failing test**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { auditOpencodeUsage } = require('../src/lib/opencode-usage-audit');

function buildMessage({ model = 'gpt-4o', created, completed, tokens }) {
  return {
    id: 'msg_1',
    sessionID: 'ses_1',
    modelID: model,
    time: { created, completed },
    tokens: {
      input: tokens.input,
      output: tokens.output,
      reasoning: tokens.reasoning,
      cache: { read: tokens.cached }
    }
  };
}

test('auditOpencodeUsage reports mismatch when server totals differ', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'vibeusage-audit-'));
  try {
    const messageDir = path.join(tmp, 'message', 'ses_1');
    await fs.mkdir(messageDir, { recursive: true });
    const messagePath = path.join(messageDir, 'msg_1.json');

    const message = buildMessage({
      created: '2025-12-29T10:14:00.000Z',
      completed: '2025-12-29T10:15:00.000Z',
      tokens: { input: 4, output: 1, reasoning: 0, cached: 0 }
    });
    await fs.writeFile(messagePath, JSON.stringify(message), 'utf8');

    const fetchHourly = async () => ({
      day: '2025-12-29',
      data: [
        {
          hour: '2025-12-29T10:00:00',
          total_tokens: '999',
          input_tokens: '999',
          cached_input_tokens: '0',
          output_tokens: '0',
          reasoning_output_tokens: '0'
        }
      ]
    });

    const result = await auditOpencodeUsage({
      storageDir: tmp,
      from: '2025-12-29',
      to: '2025-12-29',
      fetchHourly
    });

    assert.equal(result.summary.mismatched, 1);
    assert.ok(result.diffs.length > 0);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/opencode-usage-audit.test.js`

Expected: FAIL (module not found / function missing)

**Step 3: Write minimal implementation**

```js
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { listOpencodeMessageFiles, parseOpencodeIncremental } = require('./rollout');

const BUCKET_SEPARATOR = '|';

function formatHourKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate()
  ).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}:${String(
    date.getUTCMinutes() >= 30 ? 30 : 0
  ).padStart(2, '0')}:00`;
}

function toBig(n) {
  if (typeof n === 'bigint') return n;
  if (typeof n === 'number') return BigInt(n);
  if (typeof n === 'string' && n.trim()) return BigInt(n);
  return 0n;
}

function addTotals(target, delta) {
  target.input_tokens += toBig(delta.input_tokens);
  target.cached_input_tokens += toBig(delta.cached_input_tokens);
  target.output_tokens += toBig(delta.output_tokens);
  target.reasoning_output_tokens += toBig(delta.reasoning_output_tokens);
  target.total_tokens += toBig(delta.total_tokens);
}

async function buildLocalHourlyTotals({ storageDir, source = 'opencode' }) {
  const messageFiles = await listOpencodeMessageFiles(storageDir);
  const queuePath = path.join(os.tmpdir(), `vibeusage-opencode-audit-${Date.now()}.jsonl`);
  const cursors = { version: 1, files: {}, hourly: null, opencode: null };

  await parseOpencodeIncremental({ messageFiles, cursors, queuePath, source });
  await fs.rm(queuePath, { force: true }).catch(() => {});

  const byHour = new Map();
  for (const [key, bucket] of Object.entries(cursors.hourly?.buckets || {})) {
    const [bucketSource, , hourStart] = String(key).split(BUCKET_SEPARATOR);
    if (bucketSource !== source || !hourStart) continue;
    const dt = new Date(hourStart);
    if (!Number.isFinite(dt.getTime())) continue;
    const hourKey = formatHourKey(dt);
    const totals = byHour.get(hourKey) || {
      input_tokens: 0n,
      cached_input_tokens: 0n,
      output_tokens: 0n,
      reasoning_output_tokens: 0n,
      total_tokens: 0n
    };
    addTotals(totals, bucket.totals || {});
    byHour.set(hourKey, totals);
  }

  return byHour;
}

function normalizeServerRows(rows) {
  const map = new Map();
  for (const row of rows || []) {
    if (!row || !row.hour) continue;
    map.set(row.hour, {
      input_tokens: toBig(row.input_tokens),
      cached_input_tokens: toBig(row.cached_input_tokens),
      output_tokens: toBig(row.output_tokens),
      reasoning_output_tokens: toBig(row.reasoning_output_tokens),
      total_tokens: toBig(row.total_tokens)
    });
  }
  return map;
}

function diffTotals(local, server) {
  return {
    input_tokens: local.input_tokens - server.input_tokens,
    cached_input_tokens: local.cached_input_tokens - server.cached_input_tokens,
    output_tokens: local.output_tokens - server.output_tokens,
    reasoning_output_tokens: local.reasoning_output_tokens - server.reasoning_output_tokens,
    total_tokens: local.total_tokens - server.total_tokens
  };
}

function maxAbsDelta(delta) {
  return [
    delta.input_tokens,
    delta.cached_input_tokens,
    delta.output_tokens,
    delta.reasoning_output_tokens,
    delta.total_tokens
  ].reduce((acc, v) => {
    const abs = v < 0n ? -v : v;
    return abs > acc ? abs : acc;
  }, 0n);
}

function listDays(from, to) {
  const out = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return out;
  for (let dt = start; dt <= end; dt = new Date(dt.getTime() + 24 * 60 * 60 * 1000)) {
    out.push(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
      dt.getUTCDate()
    ).padStart(2, '0')}`);
  }
  return out;
}

async function auditOpencodeUsage({ storageDir, from, to, fetchHourly }) {
  const localByHour = await buildLocalHourlyTotals({ storageDir, source: 'opencode' });
  const days = listDays(from, to);
  const diffs = [];
  let matched = 0;
  let mismatched = 0;
  let maxDelta = 0n;

  for (const day of days) {
    const server = await fetchHourly(day);
    const serverByHour = normalizeServerRows(server?.data || []);
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const hourKey = `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        const local = localByHour.get(hourKey) || {
          input_tokens: 0n,
          cached_input_tokens: 0n,
          output_tokens: 0n,
          reasoning_output_tokens: 0n,
          total_tokens: 0n
        };
        const serverTotals = serverByHour.get(hourKey) || {
          input_tokens: 0n,
          cached_input_tokens: 0n,
          output_tokens: 0n,
          reasoning_output_tokens: 0n,
          total_tokens: 0n
        };
        const delta = diffTotals(local, serverTotals);
        const deltaMax = maxAbsDelta(delta);
        if (deltaMax === 0n) {
          matched += 1;
        } else {
          mismatched += 1;
          maxDelta = deltaMax > maxDelta ? deltaMax : maxDelta;
          diffs.push({ hour: hourKey, local, server: serverTotals, delta });
        }
      }
    }
  }

  return {
    summary: { days: days.length, slots: days.length * 48, matched, mismatched, maxDelta },
    diffs
  };
}

module.exports = { auditOpencodeUsage, buildLocalHourlyTotals };
```

**Step 4: Run test to verify it passes**

Run: `node --test test/opencode-usage-audit.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/opencode-usage-audit.js test/opencode-usage-audit.test.js docs/plans/2026-01-06-opencode-usage-audit-design.md docs/plans/2026-01-06-opencode-usage-audit.md
git commit -m "feat: add opencode usage audit core"
```

---

### Task 2: CLI wrapper + minimal CLI tests

**Files:**
- Create: `scripts/ops/opencode-usage-audit.cjs`
- Extend: `test/opencode-usage-audit.test.js`

**Step 1: Write the failing test**

```js
test('runAuditCli returns 2 when diffs exist', async () => {
  const { runAuditCli } = require('../scripts/ops/opencode-usage-audit.cjs');
  const code = await runAuditCli(['--from', '2025-12-29', '--to', '2025-12-29'], {
    env: { VIBEUSAGE_ACCESS_TOKEN: 'token' },
    audit: async () => ({
      summary: { days: 1, slots: 48, matched: 47, mismatched: 1, maxDelta: 10n },
      diffs: [{ hour: '2025-12-29T10:00:00', local: { total_tokens: 5n }, server: { total_tokens: 10n }, delta: { total_tokens: -5n } }]
    }),
    log: () => {},
    error: () => {}
  });
  assert.equal(code, 2);
});
```

**Step 2: Run test to verify it fails**

Run: `node --test test/opencode-usage-audit.test.js`

Expected: FAIL (module missing / function missing)

**Step 3: Write minimal implementation**

```js
#!/usr/bin/env node
'use strict';

const os = require('node:os');
const path = require('node:path');
const { beginBrowserAuth, openInBrowser } = require('../../src/lib/browser-auth');
const { auditOpencodeUsage } = require('../../src/lib/opencode-usage-audit');

const DEFAULT_BASE_URL = 'https://5tmappuk.us-east.insforge.app';

function parseArgs(argv) {
  const out = { from: null, to: null, storageDir: null, baseUrl: null, noOpen: false, limit: 10 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from') out.from = argv[++i];
    else if (arg === '--to') out.to = argv[++i];
    else if (arg === '--storage-dir') out.storageDir = argv[++i];
    else if (arg === '--base-url') out.baseUrl = argv[++i];
    else if (arg === '--no-open') out.noOpen = true;
    else if (arg === '--limit') out.limit = Number(argv[++i] || 10);
  }
  return out;
}

function resolveStorageDir(env) {
  const home = os.homedir();
  const explicit = env.OPENCODE_STORAGE_DIR || '';
  if (explicit) return path.resolve(explicit);
  const xdg = env.XDG_DATA_HOME || '';
  const base = xdg || path.join(home, '.local', 'share');
  return path.join(base, 'opencode', 'storage');
}

async function resolveAccessToken({ env, baseUrl, noOpen }) {
  const token = env.VIBEUSAGE_ACCESS_TOKEN || env.VIBESCORE_ACCESS_TOKEN || '';
  if (token) return token;
  const flow = await beginBrowserAuth({ baseUrl, timeoutMs: 10 * 60_000, open: false });
  if (!noOpen) openInBrowser(flow.authUrl);
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
  const baseUrl = args.baseUrl || env.VIBEUSAGE_INSFORGE_BASE_URL || env.VIBESCORE_INSFORGE_BASE_URL || DEFAULT_BASE_URL;
  const storageDir = args.storageDir || resolveStorageDir(env);
  const accessToken = await resolveAccessToken({ env, baseUrl, noOpen: args.noOpen });

  const fetchHourly = (day) => fetchUsageHourly({ baseUrl, accessToken, day });
  const result = await audit({ storageDir, from: args.from, to: args.to, fetchHourly });

  log(`days=${result.summary.days} slots=${result.summary.slots} matched=${result.summary.matched} mismatched=${result.summary.mismatched} max_delta=${result.summary.maxDelta}`);
  if (result.diffs.length) {
    const top = result.diffs.slice(0, args.limit || 10);
    for (const row of top) {
      log(`${row.hour} local=${row.local.total_tokens} server=${row.server.total_tokens} delta=${row.delta.total_tokens}`);
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
```

**Step 4: Run test to verify it passes**

Run: `node --test test/opencode-usage-audit.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/ops/opencode-usage-audit.cjs test/opencode-usage-audit.test.js

git commit -m "feat: add opencode usage audit cli"
```

---

### Task 3: Verification & regression record

**Files:**
- Create: `docs/pr/2026-01-06-opencode-usage-audit.md`

**Step 1: Run regression**

Run: `node --test test/opencode-usage-audit.test.js`

Expected: PASS

**Step 2: Record regression command + result**

```md
## Regression Test Gate
- [x] `node --test test/opencode-usage-audit.test.js` => PASS
```

**Step 3: Commit**

```bash
git add docs/pr/2026-01-06-opencode-usage-audit.md
git commit -m "docs: record opencode audit regression"
```
```
