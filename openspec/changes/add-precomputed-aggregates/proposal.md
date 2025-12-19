# Change: Add precomputed aggregates for scale

## Why
随着用户规模增长（目标 1 万用户），现有“实时聚合 + 即时排行”会放大数据库压力与运行时抖动风险。需要在 **不引入 BFF**、不改变现有 API contract 的前提下，建立可扩展的聚合与排行榜快照机制。

## What Changes
- 新增“按周期预计算”的排行榜快照（异步刷新），Leaderboard 读取快照而非实时全表聚合
- 将日聚合能力从“实时 view 扫描”转向“可增量维护的聚合表/物化视图”（仍通过 InsForge 数据库）
- 保持现有 endpoints 与响应结构不变（contract 不变）
- 继续使用 InsForge Functions，不引入新的 BFF 或自建服务

## Impact
- Affected specs: `vibescore-tracker`
- Affected code:
  - `insforge-src/functions/vibescore-usage-*`（读取聚合表/视图）
  - `insforge-src/functions/vibescore-leaderboard*`（读取快照）
  - 数据库对象（新增聚合表/快照表、索引、刷新机制）
