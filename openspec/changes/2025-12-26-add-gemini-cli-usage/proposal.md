# Change: Add Gemini CLI usage ingestion

## Why
- 让 Gemini CLI 的 token usage 统计与 Codex/Claude 同口径，统一进入半小时桶与 dashboard 展示。

## What Changes
- 解析 `~/.gemini/tmp/**/chats/session-*.json` 的 `messages[*].tokens` 数值字段并聚合为 UTC 半小时桶。
- `source = "gemini"`，`model = messages[*].model`。
- 输出口径采用 B 策略：`output_tokens = output + tool`。

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `src/lib/rollout.js`, `src/commands/sync.js`, `test/rollout-parser.test.js`
- **BREAKING** (if any): none

## Architecture / Flow
- 本地扫描 session JSON → 仅数值字段 → UTC 半小时桶 → 进入队列与现有上传路径。

## Risks & Mitigations
- 风险：session JSON 结构变更。
- 缓解：解析前对字段存在性做保护；测试覆盖核心映射与幂等。

## Rollout / Milestones
- M1 需求与验收标准完成
- M2 OpenSpec 提案完成
- M3 单元测试与实现
- M4 回归验证
