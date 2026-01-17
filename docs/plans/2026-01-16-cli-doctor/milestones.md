# Milestones

## M1 - Requirements & Acceptance
- Entry criteria:
  - 设计已确认
- Exit criteria:
  - `requirements-analysis.md` 完成
  - `acceptance-criteria.md` 完成
- Required artifacts:
  - docs/plans/2026-01-16-cli-doctor/requirements-analysis.md
  - docs/plans/2026-01-16-cli-doctor/acceptance-criteria.md

## M2 - OpenSpec Proposal (if applicable)
- Entry criteria:
  - M1 完成
- Exit criteria:
  - `openspec/changes/2026-01-16-add-cli-doctor/` 已创建
  - `proposal.md` / `tasks.md` / delta spec 完成
- Required artifacts:
  - openspec/changes/2026-01-16-add-cli-doctor/proposal.md
  - openspec/changes/2026-01-16-add-cli-doctor/tasks.md
  - openspec/changes/2026-01-16-add-cli-doctor/specs/vibeusage-tracker/spec.md

## M3 - Unit Test Coverage
- Entry criteria:
  - OpenSpec proposal 已批准
- Exit criteria:
  - 新增 doctor / runtime-config 测试通过
- Required artifacts:
  - test/doctor.test.js
  - test/runtime-config.test.js

## M4 - Regression & Integration
- Entry criteria:
  - M3 完成
- Exit criteria:
  - `diagnostics` 相关测试仍通过
  - CLI help 覆盖 doctor
- Required artifacts:
  - test/cli-help.test.js（更新）

## M5 - Release & Monitoring
- Entry criteria:
  - 所有测试通过
- Exit criteria:
  - 验证报告已记录
- Required artifacts:
  - verification-report.md
