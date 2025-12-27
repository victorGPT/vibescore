# Milestones

## M1 - Requirements & Acceptance
- Entry criteria: 范围与关键风险确认。
- Exit criteria: `requirements-analysis.md` + `acceptance-criteria.md` 完成。
- Required artifacts: 需求与验收文档。

## M2 - OpenSpec Proposal (if applicable)
- Entry criteria: M1 完成。
- Exit criteria: `openspec/changes/<id>/proposal.md` + `specs/**` + `tasks.md` + `design.md` 完成。
- Required artifacts: OpenSpec 变更提案与 delta spec。

## M3 - Unit Test Coverage
- Entry criteria: M2 完成。
- Exit criteria: 新增单元/集成测试通过。
- Required artifacts: 新增测试用例 + 通过记录。

## M4 - Regression & Integration
- Entry criteria: M3 完成。
- Exit criteria: `npm test` 与 copy registry 校验通过；acceptance 脚本可重复执行。
- Required artifacts: 回归命令与输出记录。

## M5 - Release & Monitoring
- Entry criteria: M4 完成。
- Exit criteria: 文档更新完成，变更可上线。
- Required artifacts: `BACKEND_API.md` 更新 + 变更记录。
