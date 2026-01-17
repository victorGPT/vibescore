## Context
当前系统存在 `vibescore` 与 `vibeusage` 双命名体系，兼容层仍会触发旧路径（例如 opencode 插件引用 `~/.vibescore`），导致运行时错误。已确认无外部依赖旧路径，可进行一次性全量迁移。

## Goals / Non-Goals
- Goals:
  - 彻底移除 `vibescore` 兼容层与别名。
  - DB/Edge/CLI/Dashboard/脚本/文档统一为 `vibeusage`。
  - 迁移可回滚，避免数据丢失。
- Non-Goals:
  - 不更改统计口径与聚合算法。
  - 不新增功能或 UI 改造。

## Decisions
- Decision: 采用“自下而上”的迁移顺序：DB → Edge → 客户端/脚本。
  - Why: 先确保数据层命名稳定，避免函数调用新名但表仍旧名。
- Decision: 旧路径与兼容层不保留。
  - Why: 单一事实来源，避免继续触发旧路径。

## Risks / Trade-offs
- 风险: 迁移步骤遗漏导致运行时错误。
  - Mitigation: 全量 `rg` 搜索 + 明确任务清单 + 回归脚本。
- 风险: DB rename 失败或不可逆。
  - Mitigation: 迁移前后行数/约束校验 + 回滚脚本。
- 取舍: Breaking change 一次性完成，减少长期维护成本。

## Migration Plan
1. DB 重命名脚本：表/视图/函数/策略名统一为 `vibeusage_*`。
2. Edge Functions：将 `vibescore-*` 实现迁移为 `vibeusage-*`，删除旧函数。
3. Dashboard：API 客户端、缓存 key、env 变量统一为 `vibeusage`。
4. CLI/脚本：移除 `VIBESCORE_*` 与 `vibescore-tracker`，仅保留 `vibeusage`。
5. 回归与验收：执行单元、集成、回归脚本；记录证据。

## Open Questions
- 无（外部依赖已确认不存在）。
