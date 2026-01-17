# Requirement Analysis

## Goal
- 完成全量命名迁移：系统内所有对外与对内标识从 `vibescore` 统一为 `vibeusage`，移除所有兼容层与旧别名，消除旧路径触发导致的错误。

## Scope
- In scope:
  - CLI 命令与环境变量：移除 `vibescore-*` 别名与 `VIBESCORE_*` 兼容读取。
  - 本地路径与插件：只使用 `~/.vibeusage/` 与 `~/.vibeusage/bin/notify.cjs`。
  - Dashboard API 客户端与缓存 key：仅 `vibeusage-*` 路径与 `VITE_VIBEUSAGE_*`。
  - Edge Functions：将 `vibescore-*` 迁移为 `vibeusage-*`，移除旧函数与代理。
  - 数据库对象：`vibescore_*` 表/视图/函数/策略重命名为 `vibeusage_*`。
  - 文档/脚本/测试：删除 `vibescore` 相关文案与脚本引用。
- Out of scope:
  - 统计口径、聚合算法、权限模型、定价与计费逻辑的业务变更。
  - 新增功能或 UI 交互。

## Users / Actors
- CLI 用户（`vibeusage`）
- Dashboard 用户（Web UI）
- InsForge Edge Functions 与数据库
- 维护人员（部署与回滚）

## Inputs
- CLI env（`VIBEUSAGE_*`）
- Dashboard env（`VITE_VIBEUSAGE_*`）
- InsForge env（`VIBEUSAGE_*` 与通用 `INSFORGE_*`）
- 数据库迁移脚本（重命名语句）

## Outputs
- 仅保留 `vibeusage-*` API 路径与函数
- 仅保留 `vibeusage_*` 数据库对象
- 仅保留 `vibeusage` 命名的 CLI/配置/文档

## Business Rules
- 兼容层完全移除：不再读取或写入任何 `vibescore` 标识。
- 迁移必须可回滚，且不得导致数据丢失。
- `notify` 插件在 `~/.vibeusage/bin/notify.cjs` 不存在时必须安全 no-op。

## Assumptions
- 当前不存在任何外部系统依赖 `/functions/vibescore-*` 或 `vibescore_*` 表。
- 已获得一次性全量迁移的批准。

## Dependencies
- InsForge 数据库与 Edge Functions
- MCP 部署流程（仅 MCP 可部署）
- 构建脚本 `scripts/build-insforge-functions.cjs`

## Risks
- 命名迁移导致历史客户端不可用（预期 breaking）。
- 数据库重命名失败或遗漏导致运行时错误。
- 回滚路径不清晰导致恢复成本上升。
