# Test Strategy

## Unit Tests
- core 层：请求解析、业务规则、错误映射。
- db 层：查询构建、参数校验、边界条件（空结果/超范围）。
- RLS helper：条件判断与拒绝路径（通过 SQL 断言或模拟）。

## Integration Tests
- 现有 Edge Functions 测试用例复用，断言响应与数据一致。
- ingest + usage 查询链路：从写入到读回一致。
- replay/idempotency：重复调用 device token issue 与 ingest，断言不产生重复记录且返回同一 token。
- schema guardrail：确认 active token 仅一条（`user_id + device_id` 且 `revoked_at IS NULL`）。
- migration guardrail：若历史存在重复 active token，迁移后仅保留最新一条，其余均被 revoke。

## Regression Tests
- `node --test test/*.test.js`
- `npm run build:insforge:check`

## Operational Guardrails
- maintenance window: confirm writes paused (API/jobs/retries) before dedupe/index runbook.

## Performance Guardrails
- usage 查询需命中现有索引（EXPLAIN 显示 Index Scan）。
- P95 ≤ 2000ms（以 handler timing 或 DB timing 记录）。
- 单请求数据库交互次数不增加。
