## Context
目前读路径依赖实时聚合（尤其 leaderboard），在用户规模增长时容易成为热点。我们需要在 InsForge 体系内做“预计算 + 缓存化”，而不是引入 BFF。

## Goals / Non-Goals
- Goals:
  - 保持现有 API contract 不变
  - 降低 leaderboard 与 summary 查询对数据库的实时聚合压力
  - 在 InsForge 内完成（函数 + 数据库）
- Non-Goals:
  - 新建 BFF / 独立服务
  - 改变端点路径、请求/响应格式

## Decisions
- 使用 **预计算快照** 作为 leaderboard 数据源（异步刷新）
- 日聚合从实时 view 升级为可增量维护的聚合表/物化视图
- 继续使用 InsForge Functions 作为查询入口

## Risks / Trade-offs
- 预计算刷新间隔引入“轻微滞后”
- 需要额外的后台任务/触发器来维护聚合表

## Migration Plan
1. 增加聚合表/快照表与索引（不改线上读取）
2. 回填历史数据并验证一致性
3. 切换 Functions 读取来源
4. 观察指标与回滚

## Open Questions
- InsForge 是否支持定时任务 / 触发器？
- 若无内建调度，是否使用外部定时触发（仍通过 InsForge Functions）？
