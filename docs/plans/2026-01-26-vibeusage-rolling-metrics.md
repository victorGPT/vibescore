# Vibeusage Rolling Metrics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add UTC-day-based rolling metrics (last 7 days, last 30 days, average per day/active day) to `vibeusage-usage-summary` without counting partial days.

**Architecture:** Rolling windows are computed on full UTC days using existing rollup/hourly aggregation paths. The rolling end day is clamped to UTC yesterday to avoid partial-day data; windows are derived from that day and summed over full-day boundaries. Active days are counted by `billable_total_tokens > 0` only.

**Tech Stack:** Node.js edge functions, Supabase query client, BigInt arithmetic, Node test runner (`node --test`).

---

**说明 / 约束**
- 我在使用 writing-plans skill 来产出实现计划。
- 该实现应在专用 worktree 中执行（brainstorming skill 已要求）。
- 本次不做前端页面模块（仅后端 API + 测试）。
- OpenSpec：不属于“重大模块”触发范围（非外部集成/跨模块核心/DB schema/安全边界/破坏性变更），因此不创建 change-id。
- 滚动窗口口径：**UTC 完整天**，排除当前 UTC 未完成日（today）；滚动的 `to` 为 `min(request.to, utcYesterday)`。
- 活跃天定义：`billable_total_tokens > 0`。
- 输出字段：保留 `rolling.last_7d`、`rolling.last_30d`，并在每个 window 内新增 `window_days` 与 `avg_per_day`（满足“平均每天”展示需求）。`avg_per_active_day` 保留。
- 168 小时滚动不做（按需求选择 UTC 天）。

---

## Task 0: Preflight（只读）
**Files:**
- Read: `insforge-src/functions/vibeusage-usage-summary.js`
- Read: `insforge-src/shared/date.js`
- Read: `test/edge-functions.test.js`

**Step 1: 快速确认现有 rolling 行为与测试位置**
- 已完成（本计划不要求重复执行）。

---

## Task 1: 先写失败用例（TDD）
**Files:**
- Modify: `test/edge-functions.test.js`

**Step 1: 更新 rolling 测试用例，覆盖 UTC 日口径与平均值**
在现有用例 `vibeusage-usage-summary returns rolling metrics when requested` 中，调整 rows 并新增断言：

```js
    const rows = [
      {
        hour_start: '2025-12-19T12:00:00.000Z',
        source: 'codex',
        model: 'gpt-4o',
        billable_total_tokens: '100',
        total_tokens: '120',
        input_tokens: '40',
        cached_input_tokens: '10',
        output_tokens: '50',
        reasoning_output_tokens: '20'
      },
      {
        hour_start: '2025-12-21T00:00:00.000Z',
        source: 'codex',
        model: 'gpt-4o',
        billable_total_tokens: '50',
        total_tokens: '60',
        input_tokens: '20',
        cached_input_tokens: '5',
        output_tokens: '25',
        reasoning_output_tokens: '10'
      }
    ];
```

新增断言（示例）：

```js
    assert.equal(body.rolling.last_7d.from, '2025-12-15');
    assert.equal(body.rolling.last_7d.to, '2025-12-21');
    assert.equal(body.rolling.last_7d.totals.billable_total_tokens, '150');
    assert.equal(body.rolling.last_7d.active_days, 2);
    assert.equal(body.rolling.last_7d.avg_per_active_day, '75');
    assert.equal(body.rolling.last_7d.avg_per_day, '21');
    assert.equal(body.rolling.last_7d.window_days, 7);

    assert.equal(body.rolling.last_30d.from, '2025-11-22');
    assert.equal(body.rolling.last_30d.to, '2025-12-21');
    assert.equal(body.rolling.last_30d.totals.billable_total_tokens, '150');
    assert.equal(body.rolling.last_30d.active_days, 2);
    assert.equal(body.rolling.last_30d.avg_per_active_day, '75');
    assert.equal(body.rolling.last_30d.avg_per_day, '5');
    assert.equal(body.rolling.last_30d.window_days, 30);
```

> 说明：`avg_per_day` 使用整数除法（BigInt）。`150 / 30 = 5`，`150 / 7 = 21`。

**Step 2: 运行测试，确认失败**
Run:
```bash
node --test test/edge-functions.test.js -t "vibeusage-usage-summary returns rolling metrics"
```
Expected: FAIL（缺少 `avg_per_day/window_days` 或 rolling 口径不一致）。

**Step 3: Commit 测试（仅测试）**
```bash
git add test/edge-functions.test.js
git commit -m "test: update rolling metrics expectations"
```

---

## Task 2: 实现 rolling UTC 日口径与平均值
**Files:**
- Modify: `insforge-src/functions/vibeusage-usage-summary.js`

**Step 1: 实现 rolling 口径与输出字段**
在 `buildRollingWindow` 中：
- 使用 UTC 日期边界（`dateFromPartsUTC` / `addDatePartsDays`）。
- 活跃天仅看 `billable_total_tokens`。
- 增加 `window_days` 与 `avg_per_day`。

示例改动（关键片段）：

```js
const { dateFromPartsUTC } = require('../shared/date'); // 如未导出则在 shared/date.js 中导出
```

```js
  const buildRollingWindow = async ({ fromDay, toDay }) => {
    const rangeStartParts = parseDateParts(fromDay);
    const rangeEndParts = parseDateParts(toDay);
    if (!rangeStartParts || !rangeEndParts) {
      return { ok: false, error: new Error('Invalid rolling range') };
    }

    const rangeStartUtc = dateFromPartsUTC(rangeStartParts);
    const rangeEndUtc = dateFromPartsUTC(addDatePartsDays(rangeEndParts, 1));
    if (!rangeStartUtc || !rangeEndUtc) {
      return { ok: false, error: new Error('Invalid rolling range') };
    }

    const totals = createTotals();
    const activeByDay = new Map();

    const ingestRollingRow = (row) => {
      if (!shouldIncludeRow(row)) return;
      const sourceKey = normalizeSource(row?.source) || DEFAULT_SOURCE;
      const { billable, hasStoredBillable } = resolveBillableTotals({ row, source: sourceKey });
      applyTotalsAndBillable({ totals, row, billable, hasStoredBillable });
      const dayKey = extractDateKey(row?.hour_start || row?.day);
      if (!dayKey) return;
      const billableTokens = row?.billable_total_tokens != null
        ? toBigInt(row?.billable_total_tokens)
        : 0n;
      if (billableTokens <= 0n) return;
      const prev = activeByDay.get(dayKey) || 0n;
      activeByDay.set(dayKey, prev + billableTokens);
    };

    const sumRes = await sumRangeWithRollup({
      rangeStartIso: rangeStartUtc.toISOString(),
      rangeEndIso: rangeEndUtc.toISOString(),
      rangeStartUtc,
      rangeEndUtc,
      onRow: ingestRollingRow
    });
    if (!sumRes.ok) return sumRes;

    const windowDays = listDateStrings(fromDay, toDay).length;
    const activeDays = Array.from(activeByDay.values()).filter((value) => value > 0n).length;
    const avgPerActive = activeDays > 0 ? totals.billable_total_tokens / BigInt(activeDays) : 0n;
    const avgPerDay = windowDays > 0 ? totals.billable_total_tokens / BigInt(windowDays) : 0n;

    return {
      ok: true,
      payload: {
        from: fromDay,
        to: toDay,
        window_days: windowDays,
        totals: { billable_total_tokens: totals.billable_total_tokens.toString() },
        active_days: activeDays,
        avg_per_active_day: avgPerActive.toString(),
        avg_per_day: avgPerDay.toString()
      }
    };
  };
```

**Step 2: rollingToDay 使用 UTC yesterday 夹逼**
在 rolling 逻辑区块（`if (rollingEnabled) { ... }`）中：

```js
    const utcYesterday = formatDateUTC(addUtcDays(new Date(), -1));
    const rollingToDay = to < utcYesterday ? to : utcYesterday;

    const rollingEndParts = parseDateParts(rollingToDay);
    if (!rollingEndParts) return respond({ error: 'Invalid rolling range' }, 400, 0);

    const last7From = formatDateParts(addDatePartsDays(rollingEndParts, -6));
    const last30From = formatDateParts(addDatePartsDays(rollingEndParts, -29));
```

并将 `buildRollingWindow({ fromDay: last7From, toDay: rollingToDay })`。

**Step 3: 如果 `dateFromPartsUTC` 未导出，补导出**
在 `insforge-src/shared/date.js` 的导出列表中增加：

```js
  dateFromPartsUTC,
```

**Step 4: 运行测试，确认通过**
Run:
```bash
node --test test/edge-functions.test.js -t "vibeusage-usage-summary returns rolling metrics"
```
Expected: PASS

**Step 5: Build edge functions**
Run:
```bash
node scripts/build-insforge-functions.cjs
```
Expected: build succeeded

**Step 6: 更新 architecture canvas（流程要求）**
Run:
```bash
node scripts/ops/architecture-canvas.cjs
```
Expected: 生成成功

**Step 7: Commit 实现**
```bash
git add insforge-src/functions/vibeusage-usage-summary.js insforge-src/shared/date.js architecture.canvas insforge-functions/vibeusage-usage-summary.js
git commit -m "feat: add UTC rolling metrics to usage summary"
```

---

## Task 3: 回归与验证记录
**Files:**
- (None)

**Step 1: 运行相关回归**
Run:
```bash
node --test test/edge-functions.test.js -t "vibeusage-usage-summary"
```
Expected: PASS（记录输出摘要）

**Step 2: 记录回归命令与结果**
在提交说明或记录文件中备注（如团队有约定位置，按约定填写）。

---

## 验收标准
- rolling 窗口仅包含 **UTC 完整天**；当前 UTC 日不计入。
- `rolling.last_7d` / `rolling.last_30d` 均包含：`from`、`to`、`window_days`、`totals.billable_total_tokens`、`active_days`、`avg_per_active_day`、`avg_per_day`。
- 活跃天仅基于 `billable_total_tokens > 0`。
- 现有非 rolling 汇总行为不变。
- 测试通过，构建成功，已本地提交（不 push）。

---

## 风险与应对
- **Rollup 延迟**：若 rollup 未生成，当前逻辑会 fallback hourly（仍为 UTC 完整天边界），不会引入部分日。
- **BigInt 整除**：avg 取整向下；若需要小数展示由前端处理。

---

## 备选方案（不选）
- **最近 168 小时**：口径与产品需求不一致，且易混入不完整日。

---

Plan complete and saved to `docs/plans/2026-01-26-vibeusage-rolling-metrics.md`. Two execution options:

1. Subagent-Driven (this session) – I dispatch a fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) – Open new session with executing-plans, batch execution with checkpoints

Which approach?
