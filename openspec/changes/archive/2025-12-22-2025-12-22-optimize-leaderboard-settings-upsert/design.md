## Context
`leaderboard-settings` 当前使用“先查再写”的双查询流程。该接口属于用户触发写入，存在不必要的 round-trip。

## Module Brief
### Scope
- IN: `leaderboard-settings` 写入路径的 DB 交互方式。
- OUT: 鉴权、响应结构、其它 endpoints。

### Interfaces
- `POST /functions/vibescore-leaderboard-settings` 不变。

### Data flow and constraints
- 优先 `upsert`（`on_conflict user_id`）一次完成写入。
- upsert 不支持或失败时回退旧逻辑。

### Non-negotiables
- 响应字段与语义保持一致。
- 写入失败必须清晰返回错误，不可吞掉。

### Test strategy
- Acceptance：验证 upsert 成功路径不触发预查询。
- 回退路径仍可完成写入。

## Decisions
- Decision: 先尝试 upsert，捕获错误即回退。

## Risks / Trade-offs
- upsert 语法与约束依赖 DB 侧索引；回退路径保证兼容。
