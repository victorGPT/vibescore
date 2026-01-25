# Module Brief: Backend Core Refactor

## Scope
- IN: Edge Functions 架构重构（handler/core/db）；RLS helper 合约统一；usage 查询性能与索引对齐；构建产物一致性。
- OUT: 新业务功能；长期缓存/新存储系统；UI/CLI 新特性。

## Interfaces
- Inputs: HTTP requests to `/functions/vibeusage-*`; DB tables `vibeusage_tracker_*`.
- Outputs: 现有 API 响应 schema（除非明确 breaking 变更）。
- Ownership: `insforge-src/shared/core/*` 为业务逻辑单一事实源。
- DB access contract: `insforge-src/shared/db/*` 统一封装 records API + SDK（no RPC）。

## Data Flow and Constraints
- handler 只负责解析/鉴权/调用 core。
- core 通过 db 层访问数据，禁止直接拼接 SQL 或绕过 db 层。
- RLS policies 统一依赖 helper（例如 `vibeusage_device_token_allows_event_insert`）。
- Hard cutover：无双轨兼容逻辑与 versioned endpoints。
- 所有用户触发写入需幂等，重复请求重放不产生额外记录。

## Non-Negotiables
- No compatibility code; hard cutover only.
- 查询必须命中索引前缀；避免全表扫描。
- RLS 是强制边界；失败必须显式返回。
- User-triggered writes are idempotent and replay-safe.

## Test Strategy
- Unit: core/db/validation.
- Integration: endpoints + ingest chain.
- Regression: `node --test test/*.test.js`.

## Milestones
- M1: OpenSpec artifacts + Canvas.
- M2: core/db + partial migration.
- M3: full migration + RLS contract.
- M4: verification + freeze.

## Plan B Triggers
- 若 usage 查询 P95 > 2000ms 且 EXPLAIN 未命中索引扫描，考虑启用 rollup 或新增只读聚合表。

## Upgrade Plan (disabled)
- N/A (hard cutover only).
