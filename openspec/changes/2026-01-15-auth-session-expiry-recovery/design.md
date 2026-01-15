# Design: Auth session expiry recovery (first-principles)

## Overview
- 建立明确的认证状态机（signed_out / signed_in / expired），用可验证 JWT 结果驱动状态变化。
- expired 为硬性边界：隐藏私有数据、阻断私有请求、仅允许单次 revalidate。
- 仅在 JWT 请求成功后清除 sessionExpired，避免误判导致的伪登录。

## Auth State Model
- 输入：`insforgeSignedIn`、`sessionExpired`、`accessToken`。
- 派生：
  - signed_in = `insforgeSignedIn && accessToken && !sessionExpired`。
  - expired = `sessionExpired === true`。
  - signed_out = 其余情况。
- 状态转移：
  - JWT 401/invalid -> `sessionExpired = true`。
  - JWT success -> `sessionExpired = false`。

## Client Flow
- 初始加载：读取 `sessionExpired`，若 `insforgeSignedIn && sessionExpired`，执行一次 revalidate。
- revalidate：使用 `getInsforgeAccessToken()` 获取最新 token，调用 `probeBackend`；成功清除过期标记，失败保持 expired。
- expired：`auth = null`，`signedIn = false`，`authAccessToken = null`，阻断所有私有请求与私有渲染。

## UI Gating
- `App` 负责状态机与 Landing/Dashboard 分发逻辑。
- `DashboardPage` 仅做渲染 gating：expired 时隐藏私有数据并展示过期提示。
- `use-backend-status` 仅在 signed_in 且非 expired 时运行。

## Non-Goals
- 不新增后端接口或修改 Insforge SDK 协议。
- 不向后兼容旧的 auth callback hash 形态（已明确不兼容）。
- 不引入自动重试或静默 refresh 流程。

## Testing
- 更新 `test/dashboard-session-expired-banner.test.js` 覆盖：
  - expired 时 authAccessToken 为空且私有请求被阻断。
  - revalidate 使用最新 token 且只在 expired 时触发。
  - 401 只会设置过期，JWT success 才清除过期。
