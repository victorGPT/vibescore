# Usage Rollup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move total token aggregation to the backend with half-hour freshness while reducing summary query load via UTC daily rollups.

**Architecture:** Add `vibescore_tracker_daily_rollup` maintained by trigger on `vibescore_tracker_hourly`. Summary queries combine rollup totals for full UTC days and hourly sums for boundary partial days. Daily endpoint returns backend summary so the dashboard never computes totals locally.

**Tech Stack:** InsForge (Postgres + Edge Functions), Node.js acceptance scripts, dashboard (React/Vite).

---

### Task 1: Add failing acceptance tests

**Files:**
- Create: `scripts/acceptance/usage-summary-hourly.cjs`
- Create: `scripts/acceptance/usage-daily-summary.cjs`

**Step 1: Write failing test (summary uses rollup when hourly empty)**

```js
#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const ROLLUP_ROWS = [
  {
    day: '2025-12-01',
    source: 'codex',
    model: 'gpt-5.2-codex',
    total_tokens: '500',
    input_tokens: '200',
    cached_input_tokens: '50',
    output_tokens: '300',
    reasoning_output_tokens: '30'
  }
];

class DatabaseStub {
  from(table) {
    this._table = table;
    return this;
  }
  select() { return this; }
  eq() { return this; }
  gte() { return this; }
  lt() { return this; }
  order() { return this; }
  range() {
    if (this._table === 'vibescore_tracker_daily_rollup') {
      return { data: ROLLUP_ROWS, error: null };
    }
    if (this._table === 'vibescore_tracker_hourly') {
      return { data: [], error: null };
    }
    return { data: [], error: null };
  }
  limit() { return { data: [], error: null }; }
}

function createClientStub() {
  return {
    auth: { async getCurrentUser() { return { data: { user: { id: 'user-id' } }, error: null }; } },
    database: new DatabaseStub()
  };
}

async function main() {
  process.env.INSFORGE_INTERNAL_URL = 'http://insforge:7130';
  process.env.INSFORGE_ANON_KEY = 'anon';
  global.Deno = { env: { get: (k) => process.env[k] || null } };
  global.createClient = createClientStub;

  const usageSummary = require('../../insforge-src/functions/vibescore-usage-summary.js');
  const res = await usageSummary(new Request(
    'http://local/functions/vibescore-usage-summary?from=2025-12-01&to=2025-12-01',
    { method: 'GET', headers: { Authorization: 'Bearer user-jwt' } }
  ));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.totals.total_tokens, '500');
  assert.equal(body.totals.input_tokens, '200');
  assert.equal(body.totals.cached_input_tokens, '50');
  assert.equal(body.totals.output_tokens, '300');
  assert.equal(body.totals.reasoning_output_tokens, '30');
  process.stdout.write(JSON.stringify({ ok: true }) + '\n');
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
```

**Step 2: Run test to verify it fails**

Run: `node scripts/acceptance/usage-summary-hourly.cjs`

Expected: FAIL because summary ignores rollup table (totals are `0`).

**Step 3: Write failing test (daily returns backend summary)**

```js
#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const HOURLY_ROWS = [
  {
    hour_start: '2025-12-01T00:00:00.000Z',
    total_tokens: '10',
    input_tokens: '4',
    cached_input_tokens: '1',
    output_tokens: '5',
    reasoning_output_tokens: '0'
  }
];

class DatabaseStub {
  from(table) { this._table = table; return this; }
  select() { return this; }
  eq() { return this; }
  gte() { return this; }
  lt() { return this; }
  order() { return this; }
  range() {
    if (this._table === 'vibescore_tracker_hourly') {
      return { data: HOURLY_ROWS, error: null };
    }
    return { data: [], error: null };
  }
  limit() { return { data: [], error: null }; }
}

function createClientStub() {
  return {
    auth: { async getCurrentUser() { return { data: { user: { id: 'user-id' } }, error: null }; } },
    database: new DatabaseStub()
  };
}

async function main() {
  process.env.INSFORGE_INTERNAL_URL = 'http://insforge:7130';
  process.env.INSFORGE_ANON_KEY = 'anon';
  global.Deno = { env: { get: (k) => process.env[k] || null } };
  global.createClient = createClientStub;

  const usageDaily = require('../../insforge-src/functions/vibescore-usage-daily.js');
  const res = await usageDaily(new Request(
    'http://local/functions/vibescore-usage-daily?from=2025-12-01&to=2025-12-01',
    { method: 'GET', headers: { Authorization: 'Bearer user-jwt' } }
  ));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.ok(body.summary, 'summary missing');
  assert.equal(body.summary.totals.total_tokens, '10');
  process.stdout.write(JSON.stringify({ ok: true }) + '\n');
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
```

**Step 4: Run test to verify it fails**

Run: `node scripts/acceptance/usage-daily-summary.cjs`

Expected: FAIL because `summary` is missing.

---

### Task 2: Add schema SQL (rollup table + trigger + backfill)

**Files:**
- Create: `scripts/ops/usage-daily-rollup.sql`
- Create: `scripts/ops/usage-daily-rollup-backfill.sql`
- Create: `scripts/ops/usage-daily-rollup-rollback.sql`

**Step 1: Write rollup DDL + trigger**

```sql
-- scripts/ops/usage-daily-rollup.sql
create table if not exists public.vibescore_tracker_daily_rollup (
  user_id uuid not null,
  day date not null,
  source text not null,
  model text not null,
  total_tokens bigint not null default 0,
  input_tokens bigint not null default 0,
  cached_input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  reasoning_output_tokens bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day, source, model)
);

create index if not exists vibescore_tracker_daily_rollup_user_day_idx
  on public.vibescore_tracker_daily_rollup (user_id, day);

create index if not exists vibescore_tracker_daily_rollup_user_source_model_day_idx
  on public.vibescore_tracker_daily_rollup (user_id, source, model, day);

create or replace function public.vibescore_apply_daily_rollup_delta()
returns trigger as $$
declare
  v_day date;
  v_user_id uuid;
  v_source text;
  v_model text;
  d_total bigint := 0;
  d_input bigint := 0;
  d_cached bigint := 0;
  d_output bigint := 0;
  d_reasoning bigint := 0;
begin
  if (tg_op = 'INSERT') then
    v_day := (new.hour_start at time zone 'UTC')::date;
    v_user_id := new.user_id;
    v_source := new.source;
    v_model := new.model;
    d_total := coalesce(new.total_tokens, 0);
    d_input := coalesce(new.input_tokens, 0);
    d_cached := coalesce(new.cached_input_tokens, 0);
    d_output := coalesce(new.output_tokens, 0);
    d_reasoning := coalesce(new.reasoning_output_tokens, 0);
  elsif (tg_op = 'DELETE') then
    v_day := (old.hour_start at time zone 'UTC')::date;
    v_user_id := old.user_id;
    v_source := old.source;
    v_model := old.model;
    d_total := -coalesce(old.total_tokens, 0);
    d_input := -coalesce(old.input_tokens, 0);
    d_cached := -coalesce(old.cached_input_tokens, 0);
    d_output := -coalesce(old.output_tokens, 0);
    d_reasoning := -coalesce(old.reasoning_output_tokens, 0);
  else
    v_day := (new.hour_start at time zone 'UTC')::date;
    v_user_id := new.user_id;
    v_source := new.source;
    v_model := new.model;
    d_total := coalesce(new.total_tokens, 0) - coalesce(old.total_tokens, 0);
    d_input := coalesce(new.input_tokens, 0) - coalesce(old.input_tokens, 0);
    d_cached := coalesce(new.cached_input_tokens, 0) - coalesce(old.cached_input_tokens, 0);
    d_output := coalesce(new.output_tokens, 0) - coalesce(old.output_tokens, 0);
    d_reasoning := coalesce(new.reasoning_output_tokens, 0) - coalesce(old.reasoning_output_tokens, 0);
  end if;

  insert into public.vibescore_tracker_daily_rollup (
    user_id, day, source, model,
    total_tokens, input_tokens, cached_input_tokens, output_tokens, reasoning_output_tokens, updated_at
  ) values (
    v_user_id, v_day, v_source, v_model,
    d_total, d_input, d_cached, d_output, d_reasoning, now()
  ) on conflict (user_id, day, source, model)
  do update set
    total_tokens = public.vibescore_tracker_daily_rollup.total_tokens + excluded.total_tokens,
    input_tokens = public.vibescore_tracker_daily_rollup.input_tokens + excluded.input_tokens,
    cached_input_tokens = public.vibescore_tracker_daily_rollup.cached_input_tokens + excluded.cached_input_tokens,
    output_tokens = public.vibescore_tracker_daily_rollup.output_tokens + excluded.output_tokens,
    reasoning_output_tokens = public.vibescore_tracker_daily_rollup.reasoning_output_tokens + excluded.reasoning_output_tokens,
    updated_at = now();

  return null;
end;
$$ language plpgsql;

drop trigger if exists vibescore_tracker_hourly_daily_rollup_trg on public.vibescore_tracker_hourly;
create trigger vibescore_tracker_hourly_daily_rollup_trg
after insert or update or delete on public.vibescore_tracker_hourly
for each row execute function public.vibescore_apply_daily_rollup_delta();
```

**Step 2: Write backfill function**

```sql
-- scripts/ops/usage-daily-rollup-backfill.sql
create or replace function public.vibescore_rebuild_daily_rollup(p_from date, p_to date)
returns void as $$
begin
  delete from public.vibescore_tracker_daily_rollup
  where day >= p_from and day <= p_to;

  insert into public.vibescore_tracker_daily_rollup (
    user_id, day, source, model,
    total_tokens, input_tokens, cached_input_tokens, output_tokens, reasoning_output_tokens, updated_at
  )
  select
    user_id,
    (hour_start at time zone 'UTC')::date as day,
    source,
    model,
    sum(coalesce(total_tokens, 0))::bigint,
    sum(coalesce(input_tokens, 0))::bigint,
    sum(coalesce(cached_input_tokens, 0))::bigint,
    sum(coalesce(output_tokens, 0))::bigint,
    sum(coalesce(reasoning_output_tokens, 0))::bigint,
    now()
  from public.vibescore_tracker_hourly
  where hour_start >= p_from::timestamptz
    and hour_start < (p_to + 1)::timestamptz
  group by 1,2,3,4;
end;
$$ language plpgsql;
```

**Step 3: Write rollback SQL**

```sql
-- scripts/ops/usage-daily-rollup-rollback.sql
drop trigger if exists vibescore_tracker_hourly_daily_rollup_trg on public.vibescore_tracker_hourly;
drop function if exists public.vibescore_apply_daily_rollup_delta();
drop function if exists public.vibescore_rebuild_daily_rollup(date, date);
drop table if exists public.vibescore_tracker_daily_rollup;
```

**Step 4: Execute SQL (manual)**

Run in InsForge SQL console or via MCP raw SQL tool:
- `scripts/ops/usage-daily-rollup.sql`
- Optional backfill: `select public.vibescore_rebuild_daily_rollup(current_date - 365, current_date);`

---

### Task 3: Implement rollup query helpers

**Files:**
- Create: `insforge-src/shared/usage-rollup.js`

**Step 1: Write helper module**

```js
'use strict';

const { toBigInt } = require('./numbers');

function createTotals() {
  return {
    total_tokens: 0n,
    input_tokens: 0n,
    cached_input_tokens: 0n,
    output_tokens: 0n,
    reasoning_output_tokens: 0n
  };
}

function addRowTotals(target, row) {
  if (!target || !row) return;
  target.total_tokens += toBigInt(row?.total_tokens);
  target.input_tokens += toBigInt(row?.input_tokens);
  target.cached_input_tokens += toBigInt(row?.cached_input_tokens);
  target.output_tokens += toBigInt(row?.output_tokens);
  target.reasoning_output_tokens += toBigInt(row?.reasoning_output_tokens);
}

async function fetchRollupRows({ edgeClient, userId, fromDay, toDay, source, model }) {
  let query = edgeClient.database
    .from('vibescore_tracker_daily_rollup')
    .select('day,source,model,total_tokens,input_tokens,cached_input_tokens,output_tokens,reasoning_output_tokens')
    .eq('user_id', userId)
    .gte('day', fromDay)
    .lte('day', toDay);
  if (source) query = query.eq('source', source);
  if (model) query = query.eq('model', model);
  const { data, error } = await query.order('day', { ascending: true });
  if (error) return { ok: false, error };
  return { ok: true, rows: Array.isArray(data) ? data : [] };
}

function sumRollupRows(rows) {
  const totals = createTotals();
  for (const row of Array.isArray(rows) ? rows : []) {
    addRowTotals(totals, row);
  }
  return totals;
}

module.exports = {
  createTotals,
  addRowTotals,
  fetchRollupRows,
  sumRollupRows
};
```

---

### Task 4: Update usage summary to use rollup + boundary hours

**Files:**
- Modify: `insforge-src/functions/vibescore-usage-summary.js`

**Step 1: Add rollup helpers and boundary summing**

Implement:
- Compute `startIso` / `endIso` as today.
- If same UTC day: sum hourly directly.
- Else:
  - `boundaryStart`: sum hourly `[startIso, startDay+1)`
  - `boundaryEnd`: sum hourly `[endDay, endIso)`
  - `rollupRange`: days between `(startDay+1 .. endDay-1)` from rollup table
- If rollup query fails, fall back to hourly aggregation for full range.

**Step 2: Run test to verify it passes**

Run: `node scripts/acceptance/usage-summary-hourly.cjs`

Expected: PASS.

---

### Task 5: Update usage daily to include backend summary

**Files:**
- Modify: `insforge-src/functions/vibescore-usage-daily.js`

**Step 1: Add backend summary**

After building `rows`, compute totals from `rows`, resolve pricing profile, and include:

```js
summary: {
  totals: {
    ...token totals,
    total_cost_usd
  },
  pricing: { ... }
}
```

**Step 2: Run test to verify it passes**

Run: `node scripts/acceptance/usage-daily-summary.cjs`

Expected: PASS.

---

### Task 6: Update dashboard to rely on backend summary

**Files:**
- Modify: `dashboard/src/hooks/use-usage-data.js`

**Step 1: Remove local aggregation**

- Stop importing `sumDailyRowsToTotals`.
- When daily data is fetched, use `dailyRes.summary` (if present) as summary.
- Keep fallback to `usage-summary` only when daily is not fetched.

---

### Task 7: Update docs & specs

**Files:**
- Modify: `docs/dashboard/api.md`
- Modify: `BACKEND_API.md`
- Modify: `openspec/specs/vibeusage-tracker/spec.md`

**Step 1: Update API contract**

- Document `summary` field in `usage-daily` response.
- Note rollup-based summary behavior.

**Step 2: Sync stable spec**

- Merge delta requirements into `openspec/specs/vibeusage-tracker/spec.md`.

---

### Task 8: Regression & evidence

**Steps:**
- Run acceptance scripts.
- Record command outputs in response.
- Run any existing regression relevant to usage endpoints.
