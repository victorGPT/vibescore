# Acceptance Criteria

## Feature: Gemini CLI usage ingestion

### Requirement: Parse Gemini session tokens with strict numeric allowlist
- Rationale: 避免采集任何对话内容。

#### Scenario: Ignore text fields
- WHEN 解析 `session-*.json` 包含 `content`/`thoughts` 文本
- THEN 仅聚合 `tokens` 数值字段
- AND 不持久化或上传任何文本字段

### Requirement: Map Gemini tokens to unified bucket fields (B strategy)
- Rationale: 与 Codex/Claude 输出口径保持一致。

#### Scenario: Output includes tool tokens
- WHEN `tokens.output = 3` 且 `tokens.tool = 2`
- THEN `output_tokens = 5`
- AND `total_tokens = tokens.total`

### Requirement: Aggregate into UTC half-hour buckets with model
- Rationale: 统一聚合维度与模型维度。

#### Scenario: Bucket uses UTC half-hour boundary
- WHEN `timestamp = 2025-12-24T18:07:10.826Z`
- THEN `hour_start = 2025-12-24T18:00:00.000Z`
- AND `model` 使用 `messages[*].model`

### Requirement: Idempotent sync for Gemini
- Rationale: 重复 `sync` 不重复计数。

#### Scenario: Re-running sync does not double-count
- WHEN 同一 session 文件未变化，连续运行两次 `sync`
- THEN 第二次的 `eventsAggregated = 0`
- AND 半小时桶不增加
