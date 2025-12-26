# Requirement Analysis

## Goal
- 让 Gemini CLI 的 token usage 采集效果与 Codex/Claude 一致：本地解析 → UTC 半小时聚合 → 幂等上传。

## Scope
- In scope:
  - 解析 `~/.gemini/tmp/**/chats/session-*.json` 的 `messages[*].tokens` 与 `timestamp`。
  - `source = "gemini"`，`model = messages[*].model`。
  - 字段映射：`input/cached/output/thoughts/tool/total` → 统一桶字段（B 口径）。
  - 幂等：重复 `sync` 不重复计数。
- Out of scope:
  - 远程 telemetry/OTLP。
  - 任何文本字段（`content`/`thoughts`）的持久化或上传。

## Users / Actors
- 使用 Gemini CLI 的本地用户。

## Inputs
- 本地 session JSON：`~/.gemini/tmp/**/chats/session-*.json`。

## Outputs
- `queue.jsonl` 中的 half-hour 聚合桶（仅数值字段）。

## Business Rules
- 仅处理数值字段；严格忽略文本字段。
- 输出 token 口径：`output_tokens = output + tool`；`total_tokens = total`。
- UTC 半小时桶。

## Assumptions
- session 文件按追加方式增长；`message.id` 可作为增量游标依据。

## Dependencies
- `src/lib/rollout.js` 聚合逻辑与 `enqueueTouchedBuckets`。

## Risks
- session JSON 结构变化导致解析失败。
- message 时间戳相同导致边界重复计数（需通过 `lastMessageId` 游标规避）。
