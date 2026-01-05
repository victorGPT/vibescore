# Usage Rollup Recovery

## 背景
Usage rollup 目前为临时降级状态，默认关闭（避免在缺表环境触发 `vibescore_tracker_daily_rollup` 查询错误）。

## 恢复条件
1. InsForge 数据库已执行 `scripts/ops/usage-daily-rollup.sql`（表 + 触发器 + 函数）。
2. 已执行 `scripts/ops/usage-daily-rollup-backfill.sql` 并完成历史回填。
3. 日志中不再出现 `relation "public.vibescore_tracker_daily_rollup" does not exist`。
4. 验收脚本通过（见下方验证记录）。

## 恢复步骤
1. 在 InsForge SQL 控制台执行：
   - `scripts/ops/usage-daily-rollup.sql`
   - `scripts/ops/usage-daily-rollup-backfill.sql`（随后调用 `vibescore_rebuild_daily_rollup` 回填）
2. 设置环境变量启用 rollup：
   - `VIBEUSAGE_ROLLUP_ENABLED=1`（推荐）
   - 或 `VIBESCORE_ROLLUP_ENABLED=1`（兼容）
3. 观察接口与日志，确认无 rollup 缺表错误。

## 回退条件
- 若再次出现 rollup 缺表/异常错误，立即取消 `VIBEUSAGE_ROLLUP_ENABLED` / `VIBESCORE_ROLLUP_ENABLED`，回到 hourly 聚合路径。

## 验证记录
- 2026-01-05: `node scripts/acceptance/usage-summary-rollup.cjs` => PASS
- 2026-01-05: `node scripts/acceptance/usage-daily-rollup-fallback.cjs` => PASS
