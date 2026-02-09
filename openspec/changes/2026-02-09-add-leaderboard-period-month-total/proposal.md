# Change: Add month + total leaderboard periods

## Why
- 当前排行榜仅支持 `week`，无法满足用户按月 / 全量视角查看趋势与长期表现的需求。

## What Changes
- Backend:
  - 扩展 `GET /functions/vibeusage-leaderboard` 支持 `period=week|month|total`（`ALL` 映射为 `total`）。
  - 扩展 `POST /functions/vibeusage-leaderboard-refresh` 支持刷新 `week|month|total`，并默认刷新 `week+month`。
  - 扩展 `GET /functions/vibeusage-leaderboard-profile` 支持按 `period` 获取对应窗口快照。
- DB:
  - 新增 `vibeusage_leaderboard_source_month`、`vibeusage_leaderboard_source_total` 供 refresh 写入快照。
  - 扩展 SECURITY DEFINER fallback functions/views 支持 `month|total`。
- Dashboard:
  - `/leaderboard` 增加时间视角切换（`WEEK / MONTH / ALL`），并把选择写入 URL query `?period=...`。
  - profile 页面跟随 `period` 展示对应窗口数据。
- Ops:
  - 定时 refresh 调整为 `week+month`（每 3 小时），新增 daily job 刷新 `total`。

## Impact
- Affected specs: `openspec/specs/vibeusage-tracker/spec.md`
- Affected code:
  - DB: migration SQL (new)
  - Edge functions: `insforge-src/functions/vibeusage-leaderboard*.js`
  - Dashboard: `dashboard/src/pages/Leaderboard*.jsx`, `dashboard/src/lib/vibeusage-api.ts`, `dashboard/src/lib/mock-data.ts`
  - Workflows: `.github/workflows/*leaderboard-refresh*.yml`

