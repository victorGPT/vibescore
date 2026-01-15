# Auth 会话过期恢复（第一性）设计

## 背景
当前 Dashboard 在 Insforge token 过期后仍可能发起私有请求或维持“已登录”渲染，导致 401 循环、Landing 跳转不稳定、用户缺乏明确的重新登录引导。需要建立以可验证 JWT 结果为唯一依据的认证状态机。

## 目标
- 用显式状态机（signed_out / signed_in / expired）统一 auth 状态。
- expired 为硬性边界：不渲染私有数据、不发起私有请求。
- 仅在 JWT 成功时清除 `sessionExpired`。
- expired 且已登录时允许一次 revalidate，使用最新 token 验证。

## 非目标
- 不新增后端接口或修改 Insforge SDK。
- 不提供旧 hash callback 兼容。
- 不实现静默刷新或自动重试。

## 架构与组件
- `dashboard/src/App.jsx`：唯一 auth 状态机与 revalidate 入口。
- `dashboard/src/pages/DashboardPage.jsx`：仅负责过期态渲染 gating。
- `dashboard/src/lib/vibescore-api.js`：JWT 401 设为过期，成功才清除。
- `dashboard/src/lib/auth-storage.js`：`sessionExpired` 持久化与订阅。
- `dashboard/src/hooks/use-backend-status.js`：仅在非过期态执行探测。

## 数据流
1. 初始化读取 `sessionExpired` 与 Insforge 登录态。
2. `sessionExpired=true && insforgeSignedIn=true` 时调用 `getInsforgeAccessToken()` 拉取最新 token。
3. 使用最新 token 调用 `probeBackend`；成功清除过期，失败保持 expired。
4. expired 状态下 `authAccessToken=null`，Dashboard 不触发任何私有请求。

## 异常与边界
- JWT 401 是唯一过期信号；网络错误不清除过期。
- revalidate 仅触发一次，避免循环请求。
- mock 模式维持现有行为，不受 expired 影响。

## 测试策略
- 更新 `test/dashboard-session-expired-banner.test.js`：
  - expired 时 `authAccessToken` 为 null。
  - revalidate 使用 `getInsforgeAccessToken()` 的最新 token。
  - 401 设置过期，JWT success 清除过期。
- 回归：`node --test test/dashboard-session-expired-banner.test.js`。
