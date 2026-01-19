# Dashboard Session Renewal (Soft Expiry) Design

**Goal:** 静置场景下保持 Dashboard 不跳回登录；401 时先静默续期并重试一次，失败则立刻显示软提示（banner），保留已加载数据与视图。

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
   - 仅对业务请求触发；刷新成功则重试一次并清除过期标记。
   - 刷新失败或重试仍 401 → `markSessionExpired` → 立刻显示软提示。
2. **Probe 401 Soft-Fail**
   - `probeBackend` 的 401 不触发 `markSessionExpired`，仅更新连接状态为 `UNSTABLE/Unauthorized`。
3. **Visibility Revalidate**
   - 页面可见/聚焦时触发一次 `getCurrentSession()`，提前刷新 session。

## Governance (OpenSpec)
- 该变更影响认证行为与会话失效处理，属于“安全/权限边界变化”。实现前需要创建 OpenSpec change-id 并获确认。

---

## Data Flow
- `requestJson/requestPostJson` 捕获 401 → 触发 `getCurrentSession()` 刷新 → 重试原请求一次。
- `useBackendStatus` 的 probe 401 仅更新状态，不影响 auth/session。
- `App` 依旧通过 `sessionExpired` 决定 banner 与登录引导，但只有“刷新失败”的业务请求才会设置该标记。

## Implementation Notes
- **Probe 软失败机制**：为 `requestJson/requestPostJson` 增加 `skipSessionExpiry` 选项；`probeBackend` 传入该选项，绕过 `markSessionExpired`。
- **刷新注入方式**：401 时调用 `insforgeAuthClient.auth.getCurrentSession()`，如返回 `session.accessToken` 则用该 token 重试一次；若拿不到或与旧 token 相同，视为刷新失败。
- **单飞刷新**：在 `vibeusage-api` 内引入 `refreshInFlight` promise，避免并发 401 导致多次刷新。

## Error Handling
- 仅 401 + JWT access token 触发刷新逻辑。
- 网络错误/超时不触发 `sessionExpired`。
- 引入“刷新单飞”保护，避免并发 401 触发多次刷新。

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
