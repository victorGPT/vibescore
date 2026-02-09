## Context
Leaderboard 当前只支持 UTC 自然周（`period=week`）的快照与查询。需要新增 `month`（自然月）与 `total`（all-time）视角。

约束：
- 隐私：默认匿名；仅当用户开启 public profile 时才暴露 `display_name/avatar_url`，并且匿名行不可暴露 `user_id`。
- 口径：仅统计 GPT 与 Claude（Claude 走 billable_total_tokens fallback）。
- 数据源：仅 Code sources（`codex|every-code|claude|opencode`），排除 `canary` 与 `model=unknown`。

## Decisions
- Month 窗口：UTC 自然月（当月 1 号到当月最后一天）。
- All 窗口：all-time，API period 用 `total`。
- Snapshot refresh：
  - `week + month`：每 3 小时刷新（现有 workflow 扩展）。
  - `total`：每日刷新一次（单独 workflow），避免高频全量扫描。
- Profile 页跟随 period：链接携带 `?period=...`，profile API 读取并返回对应窗口数据。

## Risks / Mitigations
- 风险：`total` refresh 可能对 DB 压力较大（全量扫描 + group by）。
  - 缓解：降低刷新频率（daily）；并保留 fallback views 仅作为异常路径。

