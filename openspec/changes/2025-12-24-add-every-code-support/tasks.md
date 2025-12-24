## 1. Implementation
- [x] 1.1 Confirm Every Code `token_count` envelope and fields (payload.msg) with local sample
- [x] 1.2 Extend parser to read `payload.type` and `payload.msg.type` token_count events
- [x] 1.3 Add multi-source scan: Codex (`CODEX_HOME` or `~/.codex`) + Every Code (`CODE_HOME` or `~/.code`)
- [x] 1.4 Include `source` in local bucket keys and queue entries; dedupe by `(source, hour_start)`
- [x] 1.5 Ensure uploader preserves `source` and legacy queues default to `codex`
- [x] 1.6 Update CLI help and docs to mention Every Code support and `source=every-code`

## 2. Tests
- [x] 2.1 Unit: parse Every Code `payload.msg.type == token_count`
- [x] 2.2 Unit: queue dedupe allows same hour across different sources
- [x] 2.3 Regression: old queue entries without `source` still upload as `codex`

## 3. Docs
- [x] 3.1 Update `README.md` / `README.zh-CN.md` and `src/cli.js` usage text
- [x] 3.2 Update evidence map if needed
