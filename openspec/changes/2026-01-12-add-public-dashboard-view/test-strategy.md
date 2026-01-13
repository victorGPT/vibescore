# Test Strategy

## Scope
- 覆盖 Public View 分享链接生命周期、公开读取、前端路由与 UI 隐藏逻辑。

## Test Levels

### Unit
- Dashboard `App` 路由识别 `/share/:token` 并启用 publicMode。
- `DashboardPage` 在 publicMode 下禁用 auth gate，隐藏安装/登录提示。
- Copy registry 新增 Public View 文案 key。

### Integration (edge function tests)
- Issue: 生成 token 并写入 `vibescore_public_views`（hash 存储）。
- Revoke: 设置 `revoked_at`，旧 token 失效。
- Share token: usage endpoints 能读取指定 `user_id` 数据。

### Regression
- 现有登录用户的 Dashboard 行为不变（auth gate、安装提示、数据读取）。
- usage endpoints 仍支持 JWT 访问。

## Mapping to Acceptance Criteria
- Issue/Revoke/Rotate → Integration + acceptance script.
- Public View rendering → Unit tests.
- Read-only usage with share token → Integration.

## Tooling / Commands
- `node --test test/*.test.js --test-name-pattern "public view|Public View|share"`
- `node scripts/acceptance/public-view-link.cjs`
- `npm run build:insforge:check`

## Risks & Mitigations
- 风险：share token 被误用于非读端点。
  - Mitigation：仅在 usage endpoints 增加 share token 分支。
- 风险：缓存污染。
  - Mitigation：publicMode 下禁用 localStorage 缓存 key。
