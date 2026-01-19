# Change: Update dashboard session renewal behavior

## Why
静置状态下 dashboard 会因后台 probe 401 被标记为 session expired，导致用户被动“掉线”。希望改为业务请求静默续期+重试一次，失败（含非 401 的刷新失败）才提示重登，并保留当前视图。

## What Changes
- 为业务请求引入一次静默续期与重试逻辑（single-flight 去重）
- 刷新失败或重试仍 401 → 软提示，不跳转
- 后台 probe 的 401 仅更新连接状态，不触发会话过期或刷新
- 页面可见/聚焦时触发轻量 session revalidate

## Impact
- Affected specs: vibeusage-tracker
- Affected code: dashboard/src/lib/vibeusage-api.js, dashboard/src/hooks/use-backend-status.js, dashboard/src/App.jsx
