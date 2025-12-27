# Requirement Analysis

## Goal
- 实现 Dashboard 登录后生成一次性 link code，CLI `init --link-code` 可直接换取 device token，避免二次登录。
- Dashboard 安装区提供“复制完整命令”的按钮，并在显示层用省略号遮住 link code 片段。

## Scope
- In scope:
  - Edge Function：签发 link code 与兑换 device token。
  - 新增 link code 存储（仅 hash + TTL + 使用状态）。
  - CLI `init` 增加 `--link-code` 参数并与现有浏览器登录流程兼容。
  - Dashboard 安装指令拼接 link code、显示遮罩、提供复制按钮。
  - 更新 `BACKEND_API.md` 与 copy registry。
- Out of scope:
  - 完整的 SSO/OAuth 深度集成。
  - 将长期 device token 直接暴露在命令行。
  - 非 macOS 平台安装器（`.pkg/.msi`）。
  - 在 CLI 端持久化 user JWT。

## Users / Actors
- 已登录 Dashboard 的用户。
- 本地 CLI 安装与初始化用户。
- InsForge Edge Functions（后端）。

## Inputs
- `link_code`（一次性、短时有效）。
- `device_name` / `platform`（来自 CLI）。
- `baseUrl` / `dashboardUrl`（可选覆盖）。

## Outputs
- `~/.vibescore/tracker/config.json` 中的 `deviceToken` / `deviceId`。
- Dashboard 安装命令（含 `--link-code`，可复制）。

## Business Rules
- `link_code` 仅一次性使用，TTL 10 分钟，服务端只保存 hash。
- `init --link-code` 兑换失败时回退到浏览器登录（若 `--no-auth` 则直接报错）。
- 任何可见文案都必须来自 `dashboard/src/content/copy.csv`。
- UI 可遮罩显示（省略号），但复制需包含完整命令。

## Assumptions
- Edge Function 运行环境可使用 service role key 进行受控数据库访问。
- 用户已在 Dashboard 完成登录，且 session 有效。
- Clipboard API 可用（不可用时需提示失败）。

## Dependencies
- `insforge-src/functions/*`（新函数）。
- `insforge-src/shared/*`（安全、hash 工具）。
- `src/commands/init.js`（CLI 初始化流程）。
- `dashboard/src/pages/DashboardPage.jsx` + `dashboard/src/content/copy.csv`。

## Risks
- link code 出现在 shell history 或被截图泄露 → TTL + 单次使用。
- 兑换流程中途失败导致用户重复尝试 → 允许重新生成 link code。
- RLS / service role 缺失导致兑换失败 → 明确错误提示与可观测日志。
