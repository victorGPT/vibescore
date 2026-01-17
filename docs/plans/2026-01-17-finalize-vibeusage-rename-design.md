# VibeUsage 全量命名迁移设计

本设计用于完成一次性全量迁移：彻底移除 `vibescore` 兼容层，统一使用 `vibeusage` 命名，避免旧路径继续触发错误。

## Architecture
- 单一事实来源：所有对外接口、环境变量、脚本与文档仅保留 `vibeusage`。
- 迁移顺序：DB → Edge Functions → CLI/Dashboard/脚本。
- 不保留兼容层；旧路径直接不可用。

## Components
- CLI: `vibeusage` 为唯一入口，移除 `vibescore-tracker` 别名与 `VIBESCORE_*` env。
- Storage: 仅 `~/.vibeusage/`，opencode 插件只读 `~/.vibeusage/bin/notify.cjs`。
- Edge Functions: 仅 `vibeusage-*` 端点，移除 `vibescore-*`。
- DB: 所有 `vibescore_*` 表/视图/函数/策略重命名为 `vibeusage_*`。
- Dashboard: API client 与缓存 key 全部使用 `vibeusage`。

## Data Flow
- 逻辑不变，路径与标识变化。
- DB rename 完成后，Edge Functions 仅查询 `vibeusage_*` 对象。

## Error Handling
- 迁移步骤必须可回滚；失败即停止并恢复上一状态。
- 插件在 notify 不存在时安全 no-op。

## Testing
- Unit: env 解析、插件生成、路径解析。
- Integration: DB rename 验证、Edge Functions 可用性。
- Regression: `init/sync/uninstall` 与 `usage/leaderboard` 主路径。

## Rollout
- 先完成 DB rename 与验证，再部署 Edge Functions，再更新客户端与脚本。
- 发布前必须执行回归与验收 gate。
