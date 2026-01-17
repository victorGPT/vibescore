# Milestones

## M1 - Requirements & Acceptance
- Entry criteria:
  - 目标与范围确认
- Exit criteria:
  - requirements-analysis.md 完成
  - acceptance-criteria.md 完成
- Required artifacts:
  - `docs/plans/2025-12-28-session-expired-banner/requirements-analysis.md`
  - `docs/plans/2025-12-28-session-expired-banner/acceptance-criteria.md`

## M2 - OpenSpec Proposal (if applicable)
- Entry criteria:
  - M1 完成
- Exit criteria:
  - OpenSpec proposal + tasks + spec delta 完成
- Required artifacts:
  - `openspec/changes/2025-12-28-update-session-expired-banner/proposal.md`
  - `openspec/changes/2025-12-28-update-session-expired-banner/tasks.md`
  - `openspec/changes/2025-12-28-update-session-expired-banner/specs/vibeusage-tracker/spec.md`

## M3 - Unit Test Coverage
- Entry criteria:
  - M2 完成且获批准
- Exit criteria:
  - 新增测试先失败后通过
- Required artifacts:
  - `test/dashboard-session-expired-banner.test.js`

## M4 - Regression & Integration
- Entry criteria:
  - M3 完成
- Exit criteria:
  - `npm test` 通过
  - `node scripts/validate-copy-registry.cjs` 通过
- Required artifacts:
  - 测试输出记录

## M5 - Release & Monitoring
- Entry criteria:
  - M4 完成
- Exit criteria:
  - 人工验证：401 后出现顶部横幅
- Required artifacts:
  - 验证步骤记录
