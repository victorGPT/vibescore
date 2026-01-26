# Milestones

## M1: OpenSpec + Canvas
- OpenSpec artifacts 完整（proposal/tasks/spec deltas）。
- architecture.canvas 标记 Proposed 节点完成。

## M2: Core + DB Layer
- 新的 core/db 模块落地。
- 关键 handler 迁移完成（ingest + usage-summary）。

## M3: 全量迁移
- 所有 Edge Functions 迁移至 core/db。
- RLS helper 合约统一完成。

## M4: 验证与冻结
- `npm run build:insforge:check` + `node --test test/*.test.js` 通过。
- 关键回归路径记录完毕。
- 维护窗口停写确认，去重/索引 runbook 执行并留存证据。
