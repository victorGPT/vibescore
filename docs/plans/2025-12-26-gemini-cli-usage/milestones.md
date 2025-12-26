# Milestones

## M1 - Requirements & Acceptance
- Entry criteria: 需求确认 “Gemini 与 Codex/Claude 同口径”。
- Exit criteria: `requirements-analysis.md` 与 `acceptance-criteria.md` 完成。
- Required artifacts: 需求文档 + 验收标准。

## M2 - OpenSpec Proposal (if applicable)
- Entry criteria: M1 完成。
- Exit criteria: `openspec/changes/2025-12-26-add-gemini-cli-usage/*` 生成并通过自检。
- Required artifacts: proposal/tasks/spec delta。

## M3 - Unit Test Coverage
- Entry criteria: M2 完成。
- Exit criteria: Gemini 解析测试编写并通过。
- Required artifacts: `test/rollout-parser.test.js` 新用例。

## M4 - Regression & Integration
- Entry criteria: M3 完成。
- Exit criteria: `npm test` 全绿；回归路径记录。
- Required artifacts: verification report。

## M5 - Release & Monitoring
- Entry criteria: M4 完成。
- Exit criteria: 变更上线（若需要）。
- Required artifacts: 归档记录（如适用）。
