# Dashboard Session Renewal (Soft Expiry) Design

**Goal:** 静置场景下保持 Dashboard 不跳回登录；业务请求 401 时先静默续期并重试一次，失败则立刻显示软提示（banner），保留已加载数据与视图。

**Scope (IN):**
- 业务请求 401 的“静默续期 + 重试一次”流程
- 后台探测（probe）401 仅更新连接状态，不触发登出
- 页面 focus/visibilitychange 时轻量 revalidate

**Scope (OUT):**
- 认证协议变更、后端 token 生命周期调整
- 新的 UI 文案（沿用现有 session-expired banner）

---

## Current Behavior (Problem)
- `BackendStatus` 每 120s 调 `probeBackend`（usage-summary）。
- token 过期后 probe 返回 401 → `markSessionExpired` → 本地清 auth → 页面进入 `SESSION_EXPIRED`。
- 结果：用户静置一段时间后被“自动踢出”。

## Proposed Behavior
1. **Business Request 401 → Silent Refresh → Retry Once**
   - 仅对业务请求触发（不含 probe）；刷新成功则重试一次并清除软提示。
   - 刷新失败（网络/超时/5xx）或重试仍 401 → `sessionSoftExpired = true` → 立刻显示软提示（不跳转、不清 auth）。
2. **Probe 401 Soft-Fail**
   - `probeBackend` 的 401 不触发刷新或会话过期，仅更新连接状态为 `UNSTABLE/Unauthorized`。
3. **Visibility Revalidate**
   - 页面可见/聚焦时触发一次 `getCurrentSession()`，提前刷新 session。

## Governance (OpenSpec)
- 该变更影响认证行为与会话失效处理，属于“安全/权限边界变化”。实现前需要创建 OpenSpec change-id 并获确认。

---

## Data Flow
- `requestJson/requestPostJson` 捕获业务请求 401 → 触发 `getCurrentSession()` 刷新 → 重试原请求一次。
- `useBackendStatus` 的 probe 401 仅更新状态，不影响 auth/session，也不触发 refresh。
- `App` 通过 `sessionSoftExpired` 控制 banner 与登录提示入口，不触发路由跳转。

## Implementation Notes
- **Probe 软失败机制**：为 `requestJson/requestPostJson` 增加 `skipSessionExpiry`/`requestKind` 选项；`probeBackend` 传入并禁止触发 refresh。
- **刷新注入方式**：401 时调用 `insforgeAuthClient.auth.getCurrentSession()`，如返回 `session.accessToken` 则用该 token 重试一次；若拿不到 token 视为刷新失败；若 token 相同仍执行一次重试，重试仍 401 才判定失败。
- **单飞刷新**：在 `vibeusage-api` 内引入 `refreshInFlight` promise，避免并发 401 导致多次刷新。

## Error Handling
- 仅业务请求的 401 触发刷新逻辑；probe 401 不触发。
- 刷新失败（网络错误/超时/5xx）触发软提示，不清 auth。

## UX
- 续期成功：用户无感知。
- 续期失败：立刻显示 session-expired banner（已存在），不跳转页面。

---

## Tests
- 单元测试：401 → 刷新成功 → 重试成功（不标过期）。
- 单元测试：401 → 刷新失败/重试失败（标过期）。
- 行为测试：probe 401 不触发 `sessionExpired`。

## Risks / Trade-offs
- 依赖 Insforge SDK 的 `getCurrentSession()` 是否会刷新 token；若不刷新，仍需 fallback 到登录提示（不影响安全）。
