# Change: Optimize leaderboard settings with upsert

## 结论
基于第一性原理（减少无效往返、在数据源侧一次完成写入），`leaderboard-settings` 更新改为优先执行 DB 端 upsert（`on_conflict user_id`），并在不支持时回退现有“先查再写”的逻辑，确保正确性与兼容性。

## Why
- 当前实现为 `select → update/insert` 两次往返，属于不必要的 DB/网络开销。
- 设置更新属于用户触发写入，保持一致性与可回退是硬约束。

## What Changes
- `POST /functions/vibescore-leaderboard-settings` 优先走单次 upsert。
- 若 upsert 不被支持或失败，回退旧路径（select → update/insert）。
- 接口契约与响应结构保持不变。

## Impact
- Affected specs: `vibescore-tracker`
- Affected code: `insforge-src/functions/vibescore-leaderboard-settings.js`
- 风险：upsert 语法兼容性；通过回退路径保障正确性。
