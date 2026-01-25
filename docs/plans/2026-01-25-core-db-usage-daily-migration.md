# Core/DB Usage Daily Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shared core helpers for daily usage and model filtering, refactor `vibeusage-usage-daily` to use core/db helpers, and fix the missing `getLocalParts` import in `vibeusage-usage-monthly`.

**Architecture:** Introduce `insforge-src/shared/core/usage-daily.js` and `insforge-src/shared/core/usage-filter.js` as the single source of truth for daily bucket aggregation and model filter inclusion. Edge handlers remain thin adapters; the daily handler delegates to core helpers. Update the monthly handler import bug without changing behavior.

**Tech Stack:** Node.js (CommonJS), InsForge edge functions, Supabase/InsForge database client, Node test runner (`node --test`).

---

### Task 1: Add/extend failing tests for core daily/filter helpers and monthly import guard

**Files:**
- Modify: `test/insforge-src-core-db.test.js`

**Step 1: Write the failing tests**

Add tests near the existing daily/filter tests:

```js
const fs = require('node:fs');
const path = require('node:path');
```

```js
test('shouldIncludeUsageRow returns true when model filter disabled', () => {
  const ok = usageFilter.shouldIncludeUsageRow({
    row: { hour_start: '2026-01-25T00:00:00.000Z', model: 'gpt-4o' },
    canonicalModel: null,
    hasModelFilter: false,
    aliasTimeline: new Map(),
    to: '2026-01-25'
  });
  assert.equal(ok, true);
});
```

```js
test('applyDailyBucket rejects invalid hour_start', () => {
  const { buckets } = usageDailyCore.initDailyBuckets(['2026-01-25']);
  const ok = usageDailyCore.applyDailyBucket({
    buckets,
    row: { hour_start: 'not-a-date', total_tokens: 1 },
    tzContext: { timeZone: 'UTC', offsetMinutes: 0 },
    billable: 0n
  });
  assert.equal(ok, false);
});
```

```js
test('usage-monthly imports getLocalParts from shared/date', () => {
  const filePath = path.join(__dirname, '..', 'insforge-src', 'functions', 'vibeusage-usage-monthly.js');
  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.includes('getLocalParts'));
});
```

**Step 2: Run tests to verify they fail (RED)**

Run:
```bash
node --test test/insforge-src-core-db.test.js
```
Expected: FAIL due to missing `shared/core/usage-daily.js` / `shared/core/usage-filter.js` and missing `getLocalParts` import.

---

### Task 2: Implement core daily helpers

**Files:**
- Create: `insforge-src/shared/core/usage-daily.js`
- Test: `test/insforge-src-core-db.test.js`

**Step 1: Write minimal implementation**

```js
'use strict';

const { formatLocalDateKey } = require('../date');
const { toBigInt } = require('../numbers');

function initDailyBuckets(dayKeys) {
  const buckets = new Map(
    (Array.isArray(dayKeys) ? dayKeys : []).map((day) => [
      day,
      {
        total: 0n,
        billable: 0n,
        input: 0n,
        cached: 0n,
        output: 0n,
        reasoning: 0n
      }
    ])
  );
  return { buckets };
}

function applyDailyBucket({ buckets, row, tzContext, billable }) {
  const ts = row?.hour_start;
  if (!ts) return false;
  const dt = new Date(ts);
  if (!Number.isFinite(dt.getTime())) return false;
  const day = formatLocalDateKey(dt, tzContext);
  const bucket = buckets?.get ? buckets.get(day) : null;
  if (!bucket) return false;

  bucket.total += toBigInt(row?.total_tokens);
  bucket.billable += toBigInt(billable);
  bucket.input += toBigInt(row?.input_tokens);
  bucket.cached += toBigInt(row?.cached_input_tokens);
  bucket.output += toBigInt(row?.output_tokens);
  bucket.reasoning += toBigInt(row?.reasoning_output_tokens);
  return true;
}

module.exports = {
  initDailyBuckets,
  applyDailyBucket
};
```

**Step 2: Run tests to verify they pass (GREEN)**

Run:
```bash
node --test test/insforge-src-core-db.test.js
```
Expected: tests still FAIL (usage-filter + monthly import not fixed yet).

**Step 3: Commit**

```bash
git add insforge-src/shared/core/usage-daily.js test/insforge-src-core-db.test.js
git commit -m "feat: add core daily bucket helpers"
```

---

### Task 3: Implement core usage filter helper

**Files:**
- Create: `insforge-src/shared/core/usage-filter.js`
- Test: `test/insforge-src-core-db.test.js`

**Step 1: Write minimal implementation**

```js
'use strict';

const { normalizeUsageModel } = require('../model');
const { extractDateKey, resolveIdentityAtDate } = require('../model-alias-timeline');

function shouldIncludeUsageRow({ row, canonicalModel, hasModelFilter, aliasTimeline, to }) {
  if (!hasModelFilter) return true;
  const rawModel = normalizeUsageModel(row?.model);
  const dateKey = extractDateKey(row?.hour_start || row?.day) || to;
  const identity = resolveIdentityAtDate({ rawModel, dateKey, timeline: aliasTimeline });
  const filterIdentity = resolveIdentityAtDate({
    rawModel: canonicalModel,
    usageKey: canonicalModel,
    dateKey,
    timeline: aliasTimeline
  });
  return identity.model_id === filterIdentity.model_id;
}

module.exports = {
  shouldIncludeUsageRow
};
```

**Step 2: Run tests to verify they pass (GREEN)**

Run:
```bash
node --test test/insforge-src-core-db.test.js
```
Expected: tests still FAIL (monthly import guard not fixed yet).

**Step 3: Commit**

```bash
git add insforge-src/shared/core/usage-filter.js test/insforge-src-core-db.test.js
git commit -m "feat: add core usage filter helper"
```

---

### Task 4: Refactor daily handler to use core helpers

**Files:**
- Modify: `insforge-src/functions/vibeusage-usage-daily.js`
- Modify: `test/insforge-src-core-db.test.js` (if any test names/fixtures need alignment)

**Step 1: Update imports**

Add imports:
```js
const { initDailyBuckets, applyDailyBucket } = require('../shared/core/usage-daily');
const { shouldIncludeUsageRow } = require('../shared/core/usage-filter');
const { buildPricingBucketKey, getSourceEntry, parsePricingBucketKey, resolveDisplayName } = require('../shared/core/usage-summary');
```

Remove local helper functions at the bottom of the file and the `PRICING_BUCKET_SEP` constant if no longer needed.

**Step 2: Replace local bucket init/ingest**

Replace the manual `buckets` Map creation with:
```js
const { buckets } = initDailyBuckets(dayKeys);
```

In `sumHourlyRange`, replace inline day/bucket logic with:
```js
const billable = ingestRow(row);
applyDailyBucket({ buckets, row, tzContext, billable });
```

Use `shouldIncludeUsageRow` to guard model filtering:
```js
if (!shouldIncludeUsageRow({ row, canonicalModel, hasModelFilter, aliasTimeline, to })) continue;
```

Apply the same `shouldIncludeUsageRow` check in the rollup path before aggregating buckets.

**Step 3: Update pricing bucket key helpers**

Use `buildPricingBucketKey`/`parsePricingBucketKey` from core usage-summary for daily pricing bucket keys. For profile cache, use:
```js
const key = buildPricingBucketKey('profile', modelId || '', dateKey || '');
```

**Step 4: Run tests to verify they pass (GREEN)**

Run:
```bash
node --test test/insforge-src-core-db.test.js
```
Expected: tests still FAIL until monthly import is fixed.

**Step 5: Commit**

```bash
git add insforge-src/functions/vibeusage-usage-daily.js
git commit -m "refactor: use core helpers in usage-daily"
```

---

### Task 5: Fix missing import in usage-monthly

**Files:**
- Modify: `insforge-src/functions/vibeusage-usage-monthly.js`
- Test: `test/insforge-src-core-db.test.js`

**Step 1: Add missing import**

Update the date imports to include `getLocalParts`:
```js
const {
  addDatePartsDays,
  addDatePartsMonths,
  formatDateParts,
  getLocalParts,
  getUsageTimeZoneContext,
  localDatePartsToUtc,
  parseDateParts
} = require('../shared/date');
```

**Step 2: Run tests to verify they pass (GREEN)**

Run:
```bash
node --test test/insforge-src-core-db.test.js
```
Expected: PASS.

**Step 3: Commit**

```bash
git add insforge-src/functions/vibeusage-usage-monthly.js test/insforge-src-core-db.test.js
git commit -m "fix: import getLocalParts in usage-monthly"
```

---

### Task 6: Post-change sync + verification

**Files:**
- Modify: `openspec/changes/2026-01-25-refactor-backend-core/tasks.md`
- Modify: `architecture.canvas` (via generator)

**Step 1: Update OpenSpec tasks**

Mark related items in `openspec/changes/2026-01-25-refactor-backend-core/tasks.md` as complete if applicable (1.4, 2.2, 2.3, 2.4 as appropriate).

**Step 2: Regenerate architecture canvas**

```bash
node scripts/ops/architecture-canvas.cjs
```

**Step 3: Run regression tests**

```bash
node --test test/*.test.js
```

**Step 4: Commit**

```bash
git add openspec/changes/2026-01-25-refactor-backend-core/tasks.md architecture.canvas
git commit -m "chore: sync tasks and architecture canvas"
```

