# Test Strategy

## Objectives
- 验证 Gemini 解析与字段映射正确。
- 验证半小时桶聚合与幂等行为。

## Test Levels
- Unit: `parseGeminiIncremental` 与字段映射、游标去重。
- Integration: `sync` 接入 Gemini 文件路径后可产出桶。
- Regression: 现有 Codex/Claude 解析测试不回退。
- Performance: 不强制（文件数量与大小可控）。

## Test Matrix
- Strict numeric allowlist -> Unit -> `test/rollout-parser.test.js` -> 断言仅数值字段
- Output includes tool tokens -> Unit -> `test/rollout-parser.test.js` -> 断言 `output_tokens`
- UTC bucket + model -> Unit -> `test/rollout-parser.test.js` -> 断言 `hour_start`/`model`
- Idempotent sync -> Unit -> `test/rollout-parser.test.js` -> 断言 second run = 0

## Environments
- macOS 本地 Node.js 环境。

## Automation Plan
- `node --test test/rollout-parser.test.js`
- `npm test`

## Entry / Exit Criteria
- Entry: OpenSpec 变更提案已创建；测试用例已写。
- Exit: 新增测试通过；`npm test` 全绿。

## Coverage Risks
- Gemini session JSON 结构变更导致解析不覆盖。
