# Milestones

## M1 - Requirements & Acceptance
- Entry criteria:
  - 设计确认完成。
- Exit criteria:
  - `requirements-analysis.md` 与 `acceptance-criteria.md` 完成并确认。
- Required artifacts:
  - Requirements + Acceptance 文档。

## M2 - OpenSpec Proposal (if applicable)
- Entry criteria:
  - M1 完成。
- Exit criteria:
  - `proposal.md`、`tasks.md` 与 spec delta 完成并获批准。
- Required artifacts:
  - OpenSpec 变更目录完整。

## M3 - Unit Test Coverage
- Entry criteria:
  - M2 批准。
- Exit criteria:
  - 关键单元测试覆盖 env/插件/路径。
- Required artifacts:
  - 新增/更新的单元测试。

## M4 - Regression & Integration
- Entry criteria:
  - M3 通过。
- Exit criteria:
  - 数据库迁移验证完成；Edge Functions 部署验证通过；回归脚本通过。
- Required artifacts:
  - 迁移脚本 + 验证记录。

## M5 - Release & Monitoring
- Entry criteria:
  - M4 通过。
- Exit criteria:
  - 发布前置 gate 全通过，监控无异常。
- Required artifacts:
  - 验证报告与回滚记录。
