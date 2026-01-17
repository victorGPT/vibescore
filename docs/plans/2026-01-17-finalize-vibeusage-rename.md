# Finalize VibeUsage Rename Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all legacy VibeScore naming and compatibility paths, leaving VibeUsage as the only runtime surface (CLI, dashboard, edge functions, DB, scripts, docs).

**Architecture:** Rename edge functions and database objects to `vibeusage_*`, update CLI and dashboard to call only `vibeusage-*` endpoints, and delete `vibescore-*` fallbacks. Add a regression guard that fails if `vibescore` appears in runtime code paths. Use a reversible DB rename script and a matching rollback script.

**Tech Stack:** Node.js (CLI/tests/scripts), InsForge edge functions (Deno build), Postgres, React (Vite dashboard), OpenSpec CLI.

---

### Task 1: OpenSpec change scaffolding + validation

**Files:**
- Create: `openspec/changes/2026-01-17-finalize-vibeusage-rename/proposal.md`
- Create: `openspec/changes/2026-01-17-finalize-vibeusage-rename/tasks.md`
- Create: `openspec/changes/2026-01-17-finalize-vibeusage-rename/acceptance-criteria.md`
- Create: `openspec/changes/2026-01-17-finalize-vibeusage-rename/test-strategy.md`
- Create: `openspec/changes/2026-01-17-finalize-vibeusage-rename/module-brief.md`
- Create: `openspec/changes/2026-01-17-finalize-vibeusage-rename/specs/vibeusage-tracker/spec.md`

**Step 1: Write proposal.md**

```markdown
# Change: Finalize VibeUsage rename (remove VibeScore compatibility)

## Why
Legacy VibeScore paths keep reappearing and cause runtime confusion and failures. We need a single source of truth for naming, endpoints, and storage paths.

## What Changes
- **BREAKING**: Remove `vibescore-*` endpoints, env fallbacks, and CLI aliases.
- Rename DB objects from `vibescore_*` to `vibeusage_*` with a reversible migration.
- Update CLI/dashboard/scripts/docs to use only `vibeusage` naming.
- Add a runtime guard that fails if `vibescore` appears in runtime code paths.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `src/`, `dashboard/`, `insforge-src/`, `scripts/`, `BACKEND_API.md`, `README*`
```

**Step 2: Write acceptance-criteria.md**

```markdown
# Acceptance Criteria

## Feature: Finalize VibeUsage Rename

### Requirement: CLI and local runtime use only vibeusage naming
- WHEN only `VIBESCORE_*` env vars are set
- THEN the CLI ignores them and uses defaults or `VIBEUSAGE_*` only

### Requirement: API exposes only vibeusage endpoints
- WHEN a client calls `GET /functions/vibescore-usage-summary`
- THEN the request returns 404 (function not found)
- WHEN a client calls `GET /functions/vibeusage-usage-summary`
- THEN the request returns 200

### Requirement: DB objects renamed without data loss
- WHEN `vibescore_tracker_hourly` is renamed to `vibeusage_tracker_hourly`
- THEN row counts match before/after and constraints remain

### Requirement: Dashboard uses vibeusage envs and storage keys
- WHEN `VITE_VIBEUSAGE_MOCK=1` is set
- THEN the UI uses mock data and ignores `VITE_VIBESCORE_*`

### Requirement: Runtime code paths contain no vibescore references
- WHEN searching runtime code (`bin/`, `src/`, `dashboard/`, `insforge-src/`, `scripts/`)
- THEN no `vibescore` references remain
```

**Step 3: Write test-strategy.md**

```markdown
# Test Strategy

## Unit tests
- CLI runtime config ignores `VIBESCORE_*`.
- Dashboard config ignores `VITE_VIBESCORE_*`.
- Runtime guard fails if `vibescore` is present in runtime paths.

## Integration / contract
- Edge functions respond under `vibeusage-*` slugs only.
- DB rename script preserves row counts.

## Smoke
- `node scripts/smoke/insforge-smoke.cjs` uses `VIBEUSAGE_*` envs only.
```

**Step 4: Write module-brief.md**

```markdown
# Module Brief: Finalize VibeUsage Rename

## Scope
IN: CLI/runtime naming, edge function slugs, DB object names, dashboard envs/keys, scripts and docs.
OUT: Feature behavior changes, new endpoints, pricing logic changes.

## Interfaces
- CLI → Edge Functions: `vibeusage-*`
- Dashboard → Edge Functions: `vibeusage-*`
- DB tables/functions/views: `vibeusage_*`

## Data flow & constraints
- Rename DB objects without data loss; keep migrations reversible.
- Remove all `VIBESCORE_*` env fallbacks.

## Non-negotiables
- No legacy `vibescore` runtime references after completion.

## Test strategy
- Unit tests for env + runtime guard; integration for edge slugs; verification for DB rename.

## Milestones
1) Spec + guard in place
2) CLI + dashboard renamed
3) Edge + DB rename + scripts updated
4) Tests + deployment

## Plan B triggers
- DB rename cannot be completed in maintenance window → revert using rollback script.
```

**Step 5: Write spec delta** (`openspec/changes/2026-01-17-finalize-vibeusage-rename/specs/vibeusage-tracker/spec.md`)

```markdown
## REMOVED Requirements
### Requirement: Legacy VibeScore compatibility window
**Reason**: Legacy naming causes runtime ambiguity and repeated failures.
**Migration**: Remove all `vibescore-*` endpoints, env fallbacks, and aliases.

#### Scenario: Legacy env vars ignored
- **WHEN** only `VIBESCORE_*` env vars are set
- **THEN** the CLI uses defaults or `VIBEUSAGE_*` only

## MODIFIED Requirements
### Requirement: Edge functions are exposed under vibeusage slugs only
#### Scenario: Legacy endpoint is unavailable
- **WHEN** a client calls `/functions/vibescore-usage-summary`
- **THEN** it returns 404

#### Scenario: Primary endpoint remains available
- **WHEN** a client calls `/functions/vibeusage-usage-summary`
- **THEN** it returns 200

### Requirement: Database objects use vibeusage naming
#### Scenario: Hourly table rename
- **WHEN** `vibescore_tracker_hourly` is renamed to `vibeusage_tracker_hourly`
- **THEN** row counts match before/after and constraints remain intact

## ADDED Requirements
### Requirement: Runtime paths contain no vibescore references
#### Scenario: Runtime scan is clean
- **WHEN** scanning `bin/`, `src/`, `dashboard/`, `insforge-src/`, `scripts/`
- **THEN** no `vibescore` references remain
```

**Step 6: Run validation**

Run:

```bash
openspec validate 2026-01-17-finalize-vibeusage-rename --strict
```

Expected: PASS.

**Step 7: Commit**

```bash
git add openspec/changes/2026-01-17-finalize-vibeusage-rename

git commit -m "docs: scaffold vibeusage rename spec"
```

---

### Task 2: Rename stable spec directory and references

**Files:**
- Rename: `openspec/specs/vibescore-tracker/` -> `openspec/specs/vibeusage-tracker/`
- Modify: `openspec/project.md`
- Modify: non-archived `openspec/changes/**` and `docs/**` references to the old spec path

**Step 1: Rename directory**

```bash
git mv openspec/specs/vibescore-tracker openspec/specs/vibeusage-tracker
```

**Step 2: Update references (non-archive)**

```bash
rg -l "openspec/specs/vibescore-tracker" openspec/changes docs openspec/project.md \
  --glob '!openspec/changes/archive/**'
```

Then replace `openspec/specs/vibescore-tracker` -> `openspec/specs/vibeusage-tracker` in the listed files.

**Step 3: Run validation**

```bash
openspec validate 2026-01-17-finalize-vibeusage-rename --strict
```

Expected: PASS.

**Step 4: Commit**

```bash
git add openspec/specs/vibeusage-tracker openspec/project.md openspec/changes docs

git commit -m "docs: rename vibescore spec to vibeusage"
```

---

### Task 3: Add runtime guard against `vibescore` references

**Files:**
- Create: `test/no-vibescore-runtime.test.js`

**Step 1: Write failing test**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const RUNTIME_DIRS = ['bin', 'src', 'dashboard', 'insforge-src', 'scripts'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(next, out);
    else out.push(next);
  }
  return out;
}

test('runtime code contains no vibescore references', () => {
  const offenders = [];
  for (const rel of RUNTIME_DIRS) {
    const dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) continue;
    for (const file of walk(dir)) {
      const text = fs.readFileSync(file, 'utf8');
      if (text.includes('vibescore')) offenders.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(offenders, []);
});
```

**Step 2: Run test to verify it fails**

```bash
node --test test/no-vibescore-runtime.test.js
```

Expected: FAIL with non-empty offenders list.

**Step 3: Commit (red test allowed)**

```bash
git add test/no-vibescore-runtime.test.js

git commit -m "test: add guard against vibescore references"
```

---

### Task 4: CLI + local runtime rename to vibeusage endpoints

**Files:**
- Rename: `src/lib/vibescore-api.js` -> `src/lib/vibeusage-api.js`
- Modify: `src/lib/insforge.js`, `src/lib/uploader.js`, `src/commands/sync.js`, `src/lib/browser-auth.js`
- Modify: `package.json`, `scripts/dev-bin-shim.cjs`
- Modify tests: `test/uploader.test.js`, `test/interaction-sequence-canvas.test.js`

**Step 1: Rename module + update slugs**

```js
// src/lib/vibeusage-api.js
const { createInsforgeClient } = require('./insforge-client');

async function issueDeviceToken({ baseUrl, accessToken, deviceName, platform = 'macos' }) {
  return invokeFunction({
    baseUrl,
    accessToken,
    slug: 'vibeusage-device-token-issue',
    method: 'POST',
    body: { device_name: deviceName, platform },
    errorPrefix: 'Device token issue failed'
  });
}

// ... same structure, but slugs use vibeusage-* only
```

**Step 2: Update imports + callback path**

```js
// src/lib/insforge.js
const { exchangeLinkCode, issueDeviceToken, signInWithPassword } = require('./vibeusage-api');

// src/commands/sync.js
const { syncHeartbeat } = require('../lib/vibeusage-api');

// src/lib/uploader.js
const { ingestHourly } = require('./vibeusage-api');

// src/lib/browser-auth.js
const callbackPath = `/vibeusage/callback/${nonce}`;
```

**Step 3: Remove legacy bin alias**

```json
"bin": {
  "tracker": "bin/tracker.js",
  "vibeusage": "bin/tracker.js",
  "vibeusage-tracker": "bin/tracker.js"
}
```

```js
// scripts/dev-bin-shim.cjs
{ name: 'vibeusage-tracker', rel: '../../bin/tracker.js' },
```

**Step 4: Update tests**

```js
// test/uploader.test.js
const apiPath = require.resolve('../src/lib/vibeusage-api');
```

```js
// test/interaction-sequence-canvas.test.js
await writeFixture(rootDir, 'src/lib/vibeusage-api.js', 'module.exports = {}\n');
```

**Step 5: Run tests**

```bash
node --test test/uploader.test.js
node --test test/interaction-sequence-canvas.test.js
```

Expected: PASS.

**Step 6: Commit**

```bash
git add src/lib/vibeusage-api.js src/lib/insforge.js src/lib/uploader.js src/commands/sync.js src/lib/browser-auth.js package.json scripts/dev-bin-shim.cjs test/uploader.test.js test/interaction-sequence-canvas.test.js

git commit -m "refactor: rename cli api slugs to vibeusage"
```

---

### Task 5: Remove VIBESCORE env fallbacks (CLI + dashboard + shared)

**Files:**
- Modify: `insforge-src/shared/pricing.js`, `insforge-src/shared/logging.js`, `insforge-src/shared/date.js`
- Modify: `insforge-src/functions/vibescore-ingest.js` (env keys only)
- Modify: `dashboard/src/lib/config.js`, `dashboard/src/lib/mock-data.js`, `dashboard/src/lib/http-timeout.js`
- Update tests: `test/insforge-src-shared.test.js`, `test/insforge-client.test.js`, `test/runtime-config.test.js`, `test/debug-flags.test.js`, `test/http-timeout.test.js`, `test/edge-functions.test.js`

**Step 1: Update shared env readers**

```js
// insforge-src/shared/pricing.js
const model = normalizeModelValue(getEnvValue('VIBEUSAGE_PRICING_MODEL'));
const source = normalizeSource(getEnvValue('VIBEUSAGE_PRICING_SOURCE'));
```

```js
// insforge-src/shared/logging.js
readEnvValue('VIBEUSAGE_SLOW_QUERY_MS');
```

```js
// insforge-src/shared/date.js
readEnvValue('VIBEUSAGE_USAGE_MAX_DAYS');
```

```js
// insforge-src/functions/vibescore-ingest.js
const { maxInflight, retryAfterMs } = loadIngestLimits({
  envKey: ['VIBEUSAGE_INGEST_MAX_INFLIGHT'],
  retryAfterEnvKey: ['VIBEUSAGE_INGEST_RETRY_AFTER_MS']
});
```

**Step 2: Update dashboard env usage**

```js
// dashboard/src/lib/config.js
const baseUrl = env?.VITE_VIBEUSAGE_INSFORGE_BASE_URL || env?.VITE_INSFORGE_BASE_URL || '';
const anonKey = env?.VITE_VIBEUSAGE_INSFORGE_ANON_KEY || env?.VITE_INSFORGE_ANON_KEY || '';
```

```js
// dashboard/src/lib/mock-data.js
const flag = String(import.meta.env.VITE_VIBEUSAGE_MOCK || '').toLowerCase();
```

```js
// dashboard/src/lib/http-timeout.js
const envKeys = ['VITE_VIBEUSAGE_HTTP_TIMEOUT_MS'];
```

**Step 3: Update tests to remove legacy env cases**

```js
// test/insforge-client.test.js
assert.equal(getAnonKey({ env: { VIBEUSAGE_INSFORGE_ANON_KEY: 'new' } }), 'new');
assert.equal(getAnonKey({ env: { } }), '');
```

```js
// test/runtime-config.test.js
const runtime = loadRuntimeConfig({ env: { VIBEUSAGE_INSFORGE_BASE_URL: 'https://new.example', VIBEUSAGE_DEVICE_TOKEN: 'token' } });
```

**Step 4: Run focused tests**

```bash
node --test test/insforge-client.test.js
node --test test/insforge-src-shared.test.js
node --test test/runtime-config.test.js
node --test test/http-timeout.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add insforge-src/shared/pricing.js insforge-src/shared/logging.js insforge-src/shared/date.js insforge-src/functions/vibescore-ingest.js dashboard/src/lib/config.js dashboard/src/lib/mock-data.js dashboard/src/lib/http-timeout.js test/insforge-client.test.js test/insforge-src-shared.test.js test/runtime-config.test.js test/debug-flags.test.js test/http-timeout.test.js test/edge-functions.test.js

git commit -m "refactor: drop vibescore env fallbacks"
```

---

### Task 6: Rename edge functions to vibeusage

**Files:**
- Rename: `insforge-src/functions/vibescore-*.js` -> `insforge-src/functions/vibeusage-*.js`
- Remove: `insforge-src/functions/vibeusage-*.js` wrappers that only `require('./vibescore-*.js')`
- Update: `insforge-functions` output via build step

**Step 1: Convert a function (example)**

```js
// insforge-src/functions/vibeusage-usage-summary.js
// Edge function: vibeusage-usage-summary
module.exports = withRequestLogging('vibeusage-usage-summary', async function(request, logger) {
  // existing logic...
});
```

Repeat for all slugs: device-token-issue, link-code-init/exchange, ingest, sync-ping, usage-daily/hourly/monthly/summary/heatmap/model-breakdown, leaderboard, entitlements, public-view, debug-auth, pricing-sync, events-retention.

**Step 2: Delete old vibescore files**

```bash
rm insforge-src/functions/vibescore-*.js
```

**Step 3: Run tests**

```bash
node --test test/edge-functions.test.js
```

Expected: PASS.

**Step 4: Commit**

```bash
git add insforge-src/functions

git commit -m "refactor: rename edge functions to vibeusage"
```

---

### Task 7: Rename database objects (migration + rollback)

**Files:**
- Create: `scripts/ops/rename-vibeusage-db.sql`
- Create: `scripts/ops/rename-vibeusage-db-rollback.sql`
- Update references in `insforge-src/` and `scripts/acceptance/` to `vibeusage_*`

**Step 1: Write rename-vibeusage-db.sql**

```sql
-- Rename all DB objects from vibescore_* to vibeusage_* (tables, views, sequences, indexes, functions, policies)
DO $$
DECLARE r record;
BEGIN
  -- tables/views/sequences/indexes
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE 'vibescore_%'
  LOOP
    IF r.relkind IN ('r','p') THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    ELSIF r.relkind IN ('v','m') THEN
      EXECUTE format('ALTER VIEW %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    ELSIF r.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    ELSIF r.relkind = 'i' THEN
      EXECUTE format('ALTER INDEX %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    END IF;
  END LOOP;

  -- functions
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'vibescore_%'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) RENAME TO %I', r.schema_name, r.proname, r.args, replace(r.proname, 'vibescore_', 'vibeusage_'));
  END LOOP;

  -- policies
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE 'vibescore_%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I RENAME TO %I', r.policyname, r.schemaname, r.tablename, replace(r.policyname, 'vibescore_', 'vibeusage_'));
  END LOOP;
END $$;
```

**Step 2: Write rollback** (`rename-vibeusage-db-rollback.sql`) with the inverse prefix.

```sql
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE 'vibeusage_%'
  LOOP
    IF r.relkind IN ('r','p') THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    ELSIF r.relkind IN ('v','m') THEN
      EXECUTE format('ALTER VIEW %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    ELSIF r.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    ELSIF r.relkind = 'i' THEN
      EXECUTE format('ALTER INDEX %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    END IF;
  END LOOP;

  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'vibeusage_%'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) RENAME TO %I', r.schema_name, r.proname, r.args, replace(r.proname, 'vibeusage_', 'vibescore_'));
  END LOOP;

  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE 'vibeusage_%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I RENAME TO %I', r.policyname, r.schemaname, r.tablename, replace(r.policyname, 'vibeusage_', 'vibescore_'));
  END LOOP;
END $$;
```

**Step 3: Update code references to new table names**

- Replace `vibescore_` -> `vibeusage_` in `insforge-src/` and `scripts/acceptance/`.

```bash
rg -l "vibescore_" insforge-src scripts/acceptance
```

Then update those files so table names and RPCs use `vibeusage_*`.

**Step 4: Commit**

```bash
git add scripts/ops/rename-vibeusage-db.sql scripts/ops/rename-vibeusage-db-rollback.sql insforge-src scripts/acceptance

git commit -m "refactor: rename database objects to vibeusage"
```

---

### Task 8: Dashboard API + storage rename

**Files:**
- Rename: `dashboard/src/lib/vibescore-api.js` -> `dashboard/src/lib/vibeusage-api.js`
- Update imports in `dashboard/src/App.jsx` and hooks
- Update storage keys in `dashboard/src/lib/auth-storage.js`
- Update tests in `test/dashboard-*` to new file names

**Step 1: Rename API module + imports**

```js
// dashboard/src/lib/vibeusage-api.js
export async function getUsageSummary(...) { /* keep logic, but vibeusage slugs only */ }
```

```js
// dashboard/src/App.jsx
import { probeBackend } from './lib/vibeusage-api.js';
```

**Step 2: Update storage keys**

```js
const LEGACY_STORAGE_KEY = null;
const LEGACY_SESSION_EXPIRED_KEY = null;
const STORAGE_KEY = 'vibeusage.dashboard.auth.v1';
const SESSION_EXPIRED_KEY = 'vibeusage.dashboard.session_expired.v1';
```

**Step 3: Update tests**

```js
const src = read('dashboard/src/lib/vibeusage-api.js');
```

**Step 4: Run tests**

```bash
node --test test/dashboard-function-path.test.js
node --test test/dashboard-session-expired-banner.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/lib/vibeusage-api.js dashboard/src/App.jsx dashboard/src/hooks dashboard/src/lib/auth-storage.js test/dashboard-function-path.test.js test/dashboard-session-expired-banner.test.js

git commit -m "refactor: rename dashboard api to vibeusage"
```

---

### Task 9: Docs + scripts + smoke updates

**Files:**
- Modify: `BACKEND_API.md`, `README.md`, `README.zh-CN.md`
- Modify: `scripts/smoke/insforge-smoke.cjs`, `scripts/ops/*.cjs`, `scripts/acceptance/*.cjs`

**Step 1: Update docs to vibeusage naming**

- Replace `vibescore_*` table names with `vibeusage_*`.
- Replace `vibescore-` endpoints with `vibeusage-`.

**Step 2: Update scripts env keys**

```js
// scripts/smoke/insforge-smoke.cjs
const baseUrl = process.env.VIBEUSAGE_INSFORGE_BASE_URL || 'https://5tmappuk.us-east.insforge.app';
const email = process.env.VIBEUSAGE_SMOKE_EMAIL || '';
const password = process.env.VIBEUSAGE_SMOKE_PASSWORD || '';
```

**Step 3: Commit**

```bash
git add BACKEND_API.md README.md README.zh-CN.md scripts

git commit -m "docs: update vibeusage naming"
```

---

### Task 10: Verification + build + canvas sync

**Files:**
- Update: `architecture.canvas`

**Step 1: Run full tests**

```bash
npm test
```

Expected: PASS.

**Step 2: Build InsForge functions**

```bash
npm run build:insforge
npm run build:insforge:check
```

Expected: build succeeds and generated files reference `vibeusage-*`.

**Step 3: Run runtime guard**

```bash
node --test test/no-vibescore-runtime.test.js
```

Expected: PASS.

**Step 4: Update canvas**

```bash
node scripts/ops/architecture-canvas.cjs
```

**Step 5: Validate OpenSpec**

```bash
openspec validate 2026-01-17-finalize-vibeusage-rename --strict
```

Expected: PASS.

**Step 6: Commit**

```bash
git add insforge-functions architecture.canvas

git commit -m "chore: rebuild insforge functions and sync canvas"
```

---

### Task 11: Deployment (MCP only)

**Step 1: Deploy updated edge functions**

Use MCP to update all `vibeusage-*` functions after build output is ready.

**Step 2: Record verification**

- Capture deploy output.
- Update `openspec/changes/2026-01-17-finalize-vibeusage-rename/verification-report.md` with commands and results.

**Step 3: Commit**

```bash
git add openspec/changes/2026-01-17-finalize-vibeusage-rename/verification-report.md

git commit -m "docs: record vibeusage rename verification"
```

---

### Task 12: Post-implementation cleanup

**Step 1: Run openspec validate**

```bash
openspec validate --strict
```

Expected: PASS.

**Step 2: Ensure no vibescore references remain in runtime paths**

```bash
rg -n "vibescore" bin src dashboard insforge-src scripts
```

Expected: no matches.

**Step 3: Final commit (if needed)**

```bash
git status -sb
```

Expected: clean.
```
