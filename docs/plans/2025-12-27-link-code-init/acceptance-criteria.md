# Acceptance Criteria

## Feature: One-login bootstrap via link code

### Requirement: Dashboard can issue a short-lived link code
- Rationale: 避免 CLI 端再次登录。

#### Scenario: Issue link code
- WHEN 已登录用户在 Dashboard 请求 link code
- THEN 服务端返回 `link_code` 与 `expires_at`
- AND 服务端仅保存 `link_code` 的 hash

### Requirement: Link code can be exchanged for a device token
- Rationale: CLI 以一次性 code 换取 device token。

#### Scenario: Exchange succeeds
- WHEN CLI 提交有效且未过期的 `link_code`
- THEN 返回 `device_id` 与 `device_token`
- AND 标记该 `link_code` 已使用

#### Scenario: Exchange rejects reuse or expiry
- WHEN `link_code` 已使用或已过期
- THEN 兑换失败并返回可识别的错误

### Requirement: CLI init supports `--link-code`
- Rationale: 一次登录完成设备绑定。

#### Scenario: CLI init uses link code
- WHEN 用户运行 `npx --yes @vibescore/tracker init --link-code <code>`
- THEN CLI 不打开浏览器，直接完成 device token 配置

#### Scenario: CLI init falls back on failure
- WHEN `--link-code` 兑换失败且未设置 `--no-auth`
- THEN CLI 回退到浏览器登录流程

### Requirement: Install command is masked on screen but copies full value
- Rationale: 降低泄露风险，同时保证可复制。

#### Scenario: Masked display with copy
- WHEN Dashboard 显示安装命令
- THEN 屏幕展示应遮罩 `link_code`（省略号）
- AND 点击复制按钮时复制完整命令（含完整 `link_code`）
- AND 按钮与提示文案来自 `copy.csv`
