# Acceptance Criteria

1. 所有 Edge Functions 处理器只负责鉴权/解析/调用 core，业务逻辑不在 handler 中实现。
2. 所有数据库读写通过统一的 db 访问层进行（records API/SDK 统一封装，无 RPC），且查询条件覆盖索引前缀（例如 `user_id + hour_start`）。
3. RLS 策略统一依赖单一 helper 函数（`vibeusage_device_token_allows_event_insert`），避免重复逻辑与分叉策略。
4. device token issue 幂等：同 `user_id + device_id` 重放请求返回同一 token，不新增记录。
5. `vibeusage_tracker_device_tokens` 存在 active token 唯一约束（`user_id + device_id` 且 `revoked_at IS NULL`）。
6. 若历史存在同 `user_id + device_id` 多条 active token，迁移后仅保留最新一条（按 `created_at`，必要时以 `last_used_at` 兜底），其余 `revoked_at` 不为空。
7. 去重/索引创建在维护窗口执行，且写入已暂停（API、任务、重试禁写）。
8. `device-token-issue` 响应 schema 保持 `{ device_id, token, created_at }` 不变。
9. ingest 仍保持幂等：相同 bucket（同 `user_id + device_id + source + model + hour_start`）重复提交不产生重复记录。
10. `npm run build:insforge:check` 通过，`insforge-functions/` 产物与源码一致。
11. 关键回归路径通过：device token issue、ingest、usage summary/daily/hourly/heatmap/monthly/model-breakdown。
12. 性能验收：usage 查询 P95 ≤ 2000ms，且 EXPLAIN 显示 Index Scan 命中索引前缀。
