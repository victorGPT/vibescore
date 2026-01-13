# Usage Breakdown Pricing Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align usage-model-breakdown cost totals with usage-summary by pricing per model/date buckets.

**Architecture:** Extend vibescore-usage-model-breakdown to compute cost from model/date buckets (using resolvePricingProfile per bucket) and sum per source/model; keep pricing metadata aligned with summary’s mixed/add/overlap behavior.

**Tech Stack:** Node.js, Insforge edge functions, shared pricing utilities, Node test runner.

---

### Task 1: Add failing test for per-alias pricing in model breakdown

**Files:**
- Modify: `test/edge-functions.test.js`

**Step 1: 编写失败测试**

```js
test('vibeusage-usage-model-breakdown prices per-alias effective_from when unfiltered', async () => {
  const fn = require('../insforge-functions/vibeusage-usage-model-breakdown');

  const userId = '23232323-2323-2323-2323-232323232323';
  const userJwt = 'user_jwt_test';

  const hourlyRows = [
    {
      hour_start: '2025-01-15T00:00:00.000Z',
      source: 'codex',
      model: 'gpt-foo',
      total_tokens: 1000000,
      input_tokens: 1000000,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0
    },
    {
      hour_start: '2025-02-15T00:00:00.000Z',
      source: 'codex',
      model: 'gpt-foo',
      total_tokens: 1000000,
      input_tokens: 1000000,
      cached_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0
    }
  ];

  const aliasRows = [
    {
      usage_model: 'gpt-foo',
      canonical_model: 'alpha',
      display_name: 'Alpha',
      effective_from: '2025-01-01',
      active: true
    },
    {
      usage_model: 'gpt-foo',
      canonical_model: 'beta',
      display_name: 'Beta',
      effective_from: '2025-02-01',
      active: true
    }
  ];

  const pricingProfiles = {
    alpha: {
      model: 'alpha',
      source: 'openrouter',
      effective_from: '2025-01-01',
      input_rate_micro_per_million: 1000000,
      cached_input_rate_micro_per_million: 0,
      output_rate_micro_per_million: 0,
      reasoning_output_rate_micro_per_million: 0
    },
    beta: {
      model: 'beta',
      source: 'openrouter',
      effective_from: '2025-02-01',
      input_rate_micro_per_million: 2000000,
      cached_input_rate_micro_per_million: 0,
      output_rate_micro_per_million: 0,
      reasoning_output_rate_micro_per_million: 0
    }
  };

  globalThis.createClient = (args) => {
    if (args && args.edgeFunctionToken === userJwt) {
      return {
        auth: {
          getCurrentUser: async () => ({ data: { user: { id: userId } }, error: null })
        },
        database: {
          from: (table) => {
            if (table === 'vibescore_tracker_hourly') {
              const query = createQueryMock({ rows: hourlyRows });
              return { select: () => query };
            }
            if (table === 'vibescore_model_aliases') {
              return createQueryMock({ rows: aliasRows });
            }
            if (table === 'vibescore_pricing_profiles') {
              const state = { model: null };
              const query = {
                select: () => query,
                eq: (col, value) => {
                  if (col === 'model') state.model = value;
                  return query;
                },
                lte: () => query,
                order: () => query,
                or: (expr) => {
                  const match = String(expr).match(/model\.eq\.([^,]+)/);
                  if (match) state.model = match[1];
                  return query;
                },
                limit: async () => {
                  const row = pricingProfiles[state.model];
                  return { data: row ? [row] : [], error: null };
                }
              };
              return query;
            }
            if (table === 'vibescore_pricing_model_aliases') {
              return createQueryMock({ rows: [] });
            }
            throw new Error(`Unexpected table ${table}`);
          }
        }
      };
    }
    throw new Error(`Unexpected createClient args: ${JSON.stringify(args)}`);
  };

  const req = new Request(
    'http://localhost/functions/vibeusage-usage-model-breakdown?from=2025-01-01&to=2025-02-15',
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${userJwt}` }
    }
  );

  const res = await fn(req);
  assert.equal(res.status, 200);
  const body = await res.json();
  const source = body.sources.find((entry) => entry.source === 'codex');
  const alpha = source?.models?.find((entry) => entry.model_id === 'alpha');
  const beta = source?.models?.find((entry) => entry.model_id === 'beta');
  assert.equal(alpha?.totals?.total_cost_usd, '1.000000');
  assert.equal(beta?.totals?.total_cost_usd, '2.000000');
  assert.equal(source?.totals?.total_cost_usd, '3.000000');
});
```

**Step 2: 运行测试确认失败**

Run: `node --test test/edge-functions.test.js`

Expected: FAIL with mismatch on `total_cost_usd` (breakdown still uses single pricing profile).

---

### Task 2: Align breakdown cost calculation with summary buckets

**Files:**
- Modify: `insforge-src/functions/vibescore-usage-model-breakdown.js`

**Step 1: 编写最小实现**

目标：在按 source/model 聚合 totals 的同时，新增按 `source + model_id + dateKey` 的 cost bucket 聚合，并用 `resolvePricingProfile` 逐 bucket 计算成本，累加到 source/model。

**Step 2: 更新 totals 输出**

- 为 source/model entry 增加 `cost_micros` 仅用于内部累加。
- 调整 `formatTotals`：当 entry 有 `cost_micros` 时优先用它生成 `total_cost_usd`，并避免把 `cost_micros` 暴露到响应。
- pricing metadata：沿用 summary 的 `pricingModes` 规则（1 个用该模式，多于 1 个用 `mixed`），profile 取 `impliedModelId` 的 `resolvePricingProfile`。

---

### Task 3: 生成函数构建产物

**Files:**
- Modify (generated): `insforge-functions/vibescore-usage-model-breakdown.js`
- Modify (generated): `insforge-functions/vibeusage-usage-model-breakdown.js`

**Step 1: 运行构建脚本**

Run: `node scripts/build-insforge-functions.cjs`

Expected: Generated files updated.

---

### Task 4: 验证与回归

**Step 1: 重新运行单测**

Run: `node --test test/edge-functions.test.js`

Expected: PASS for new breakdown pricing test.

**Step 2: 回归用例记录**

Run: `node --test test/edge-functions.test.js`

Expected: PASS (记录命令与结果到提交说明/说明文档)。

---

### Task 5: Canvas 同步

**Files:**
- Modify: `architecture.canvas`

**Step 1: 将 Proposed 改为 Implemented**

把 `vibescore-usage-model-breakdown` 节点中的 `Status: Proposed` 改为 `Status: Implemented`。

**Step 2: 重新生成画布并确认一致**

Run: `node scripts/ops/architecture-canvas.cjs`

Expected: No drift beyond known status/notes updates.

---

### Task 6: 提交

**Step 1: Commit**

```bash
git add test/edge-functions.test.js insforge-src/functions/vibescore-usage-model-breakdown.js insforge-functions/vibescore-usage-model-breakdown.js insforge-functions/vibeusage-usage-model-breakdown.js architecture.canvas
git commit -m "fix: align usage model breakdown pricing"
```

