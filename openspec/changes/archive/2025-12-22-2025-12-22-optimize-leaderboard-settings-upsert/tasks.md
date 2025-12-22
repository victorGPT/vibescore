## 1. Implementation
- [x] 1.1 在 `leaderboard-settings` 先尝试 `upsert`（`on_conflict user_id`）。
- [x] 1.2 upsert 失败时回退旧逻辑（select → update/insert）。
- [x] 1.3 保持响应结构与错误处理一致。

## 2. Verification
- [x] 2.1 新增 acceptance 脚本覆盖 upsert 成功与回退路径。
- [x] 2.2 运行 acceptance 脚本并记录结果。
