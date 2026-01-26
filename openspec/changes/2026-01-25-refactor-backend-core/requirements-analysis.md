# Requirements Analysis

## Goal
对后端（Edge Functions + DB + RLS + 构建产物）进行结构化重构，统一函数设计与数据访问边界，提升可维护性与性能，并保持硬切换（无双轨兼容）。

## In Scope
- Edge Functions 结构：薄处理器（handler）+ 共享核心层（core）+ DB 访问层（db）。
- 数据访问与契约：统一查询入口、明确索引使用与查询边界。
- RLS/安全边界：策略依赖单一 helper 函数与可审计契约。
- 性能优化：usage 相关查询路径、索引与聚合路径梳理。
- 构建与部署：`insforge-src` → `insforge-functions` 的一致性与可验证性。
- 文档：`BACKEND_API.md` 与 OpenSpec delta。

## Out of Scope
- 新增业务功能或新端点（除非为重构引入必要的新路径）。
- Dashboard UI 与 CLI 的功能扩展（仅配合硬切换所需的调用路径更新）。
- 长期缓存/新存储系统引入（除非作为 Plan B 触发）。

## Constraints
- **硬切换**：同日更新后端与客户端，无长期双轨兼容代码。
- **路径替换**：任何新路径必须在同一切换窗口替换旧路径，不允许并行运行。
- **Single source of truth**：业务逻辑集中在 core；DB 访问集中在 db 层；契约以 OpenSpec 为准。
- **No compatibility code**：禁止为了兼容旧行为而保留分支逻辑。
- **安全**：RLS 是强制边界；鉴权失败必须显式返回。
- **性能**：查询路径必须命中现有索引，避免全表扫描。
- **幂等与重放**：所有用户触发写入必须幂等，可重放且不产生重复记录。
- **维护窗口停写**：维护窗口内必须暂停写入（含 device token 写入），确保去重与索引创建过程无并发写入。
- **设备 token 幂等**：active token 仅一条（`user_id + device_id` 且 `revoked_at IS NULL`）；重放返回同一 token，不新建记录。
- **历史重复去重规则**：若历史已存在同 `user_id + device_id` 的多个 active token，迁移时保留最新一条（按 `created_at`，必要时以 `last_used_at` 兜底），其余设置 `revoked_at` 并记录去重数量。
- **device token response schema 不变**：`device-token-issue` 响应字段保持 `{ device_id, token, created_at }`；如需变更，必须同步更新 `BACKEND_API.md` 与验收/回归用例。

## Risks
- 大范围重构引入行为漂移或边界回归。
- RLS/helper 契约不一致导致权限漏洞或误拒绝。
- 构建产物漂移（源码与部署产物不同步）。

## Success Criteria
- 核心逻辑集中于共享 core；所有函数为薄适配层。
- DB 访问统一且可审计；RLS 通过单一 helper 合约约束。
- usage 相关查询性能不低于现有版本，且可验证。
- `npm run build:insforge:check` 通过；关键回归测试通过。
