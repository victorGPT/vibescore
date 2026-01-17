# Change: Add session expired banner with soft auth gating

## Why
- InsForge 的 refresh cookie 无法落在 Functions 域，401 会频繁出现，需要一个可解释且低摩擦的用户体验。

## What Changes
- 前端在 401 时标记 session expired 并清空本地 auth。
- session expired 时仍渲染 Dashboard，并在顶部显示非阻塞横幅提示重新登录。
- 首次未登录仍保留 LandingPage。
- 新增 copy registry 文案键。

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code: `dashboard/src/lib/auth-storage.js`, `dashboard/src/lib/vibescore-api.js`, `dashboard/src/hooks/use-auth.js`, `dashboard/src/App.jsx`, `dashboard/src/pages/DashboardPage.jsx`, `dashboard/src/content/copy.csv`
- **BREAKING**: None

## Architecture / Flow
- 401 → `markSessionExpired()` → 清空 auth + 写入 `session_expired`。
- `useAuth` 读取 `session_expired` 并将 `signedIn` 视为 false。
- `App` 在 `session_expired` 为 true 时渲染 Dashboard；否则保持 LandingPage。
- `DashboardPage` 渲染顶部横幅并绕过 `auth_required` Gate。

## Risks & Mitigations
- 误判 401 → 仅在 401 时触发，避免 403/5xx 误伤。
- UI 误导 → 横幅明确提示“会话过期，需要重新登录”。

## Rollout / Milestones
- M1: Requirements & Acceptance
- M2: OpenSpec Proposal
- M3: Tests (RED)
- M4: Implementation + Regression
- M5: Manual verification
