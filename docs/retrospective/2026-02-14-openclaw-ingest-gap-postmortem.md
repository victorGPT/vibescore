# Postmortem: OpenClaw Usage Ingest Gap (JSONL-first assumption broke)
Report date (2026-02-14):
Owner: Victor
Audience: VibeUsage engineering + integration maintainers

## 1. Scope
- In scope: OpenClaw hook trigger path, `sync --from-openclaw`, OpenClaw session usage parsing, fallback ingest logic.
- Out of scope: Codex notify implementation, non-OpenClaw sources (Claude/Gemini/Opencode), dashboard rendering.
- Time window (2026-02-13 → 2026-02-14):

## 2. Goals & Plan (Before)
- Intended outcomes:
  - OpenClaw hook should auto-trigger `vibeusage sync --from-openclaw`.
  - Sync should ingest OpenClaw usage from session JSONL incrementally and upload automatically.
- Key assumptions:
  - OpenClaw `sessions/<id>.jsonl` is present and contains non-zero `message.usage.totalTokens` for completed sessions.
  - Hook events (`command:new`/`command:stop`) are enough to catch session rollover/completion.
  - If hook runs and upload path is healthy, data should appear in `source=openclaw` without extra logic.

## 3. Outcome vs Plan
- What actually happened:
  - Hook wiring and upload transport were healthy.
  - But many OpenClaw sessions had missing/empty JSONL or only `delivery-mirror` entries with `totalTokens=0`.
  - Result: sync ran successfully but queued `0` buckets for many real sessions.
- Deviations/gaps:
  - Data-source contract differed from design assumption (JSONL-first usage events were not reliable in all sessions).
  - Detection was missing: system saw "sync success" but did not flag "session totals > 0 while parsed usage == 0".

## 4. Impact
- User/customer impact:
  - `source=openclaw` usage under-counted/missing for affected windows.
- Ops impact:
  - Manual deep-dive + ad-hoc verification across hooks, session files, and DB.
  - Emergency backfill run required.
- Recovery result:
  - Backfill executed for missing sessions; DB confirmed ingest restored.

## 5. Timeline (Detection → Mitigation → Resolution)
- Detection date (2026-02-13):
  - Found repeated successful syncs with `New buckets queued: 0` despite high `sessions.json` totals.
- Mitigation date (2026-02-14):
  - Implemented fallback ingest based on hook-provided previous session totals.
  - Expanded hook trigger coverage to include `command:reset`.
- Resolution date (2026-02-14):
  - Released `v0.2.20`.
  - Ran production backfill and verified `source=openclaw` rows/tokens via InsForge MCP.

## 6. Evidence
- OpenClaw inconsistency examples:
  - `sessions.json` had high `totalTokens`, while matching JSONL was missing/empty/zero-usage.
- Code changes:
  - `src/lib/openclaw-hook.js`: trigger set expanded (`new/reset/stop`) + richer env payload.
  - `src/commands/sync.js`: `applyOpenclawTotalsFallback` + `openclaw.fallback.state.json` de-dup.
  - Tests: `test/sync-openclaw-trigger.test.js` adds zero-usage JSONL fallback/idempotency scenarios.
- Release:
  - `v0.2.20` (latest).
- Backfill result (2026-02-14):
  - 8 sessions patched, cumulative delta `1,062,436` tokens, queue drained to zero.
  - MCP verification (device `227e9b3a-0de2-4ad6-9849-a731afa06aa4`, Asia/Tokyo `2026-02-13..2026-02-14`):
    - `rows_count=7`, `total_tokens=1,258,845`, `input_tokens=655,490`, `output_tokens=8,597`.

## 7. Root Causes (with Stage Attribution)
- Primary cause (Design/Integration Contract):
  - Parser design assumed OpenClaw session JSONL is the authoritative and sufficient usage source.
  - In production, session summary totals (`sessions.json`) and JSONL usage events can diverge.
- Secondary cause (Detection/Observability):
  - No guardrail alert for: "session summary totals increase" + "parsed JSONL usage remains zero".
  - Health checks focused on hook registration/upload success, not semantic data completeness.
- Tertiary cause (Trigger Semantics):
  - Initial trigger set missed some practical lifecycle paths; `reset` was not covered.

## 8. Action Items (Owner + Due Date)
- [ ] Add automated completeness check in `doctor`/diagnostics:
  - Detect sessions where `sessions.json.totalTokens > 0` but parsed JSONL contribution is 0 for N runs.
  - Owner: Victor, Due: 2026-02-16.
- [ ] Add periodic anomaly report (non-blocking):
  - Log/emit count of "fallback-used sessions" and "jsonl-missing sessions".
  - Owner: Victor, Due: 2026-02-17.
- [ ] Add regression fixture from real OpenClaw failure shapes:
  - missing JSONL, empty JSONL, `delivery-mirror totalTokens=0`, late-backfill idempotency.
  - Owner: Victor, Due: 2026-02-17.
- [ ] Add ops runbook snippet for one-click OpenClaw backfill + verification SQL/MCP query.
  - Owner: Victor, Due: 2026-02-16.

## 9. Prevention Rules
- Rule 1: OpenClaw ingest must be multi-source resilient (JSONL primary + session totals fallback).
- Rule 2: "Sync succeeded" is not enough; must track semantic completeness indicators.
- Rule 3: Hook lifecycle coverage must include `new/reset/stop` unless OpenClaw event model changes.
- Enforcement:
  - CI tests for fallback + idempotency.
  - Runtime diagnostics warnings for summary-vs-jsonl mismatch.
  - Release checklist includes one MCP-side aggregate verification for `source=openclaw`.

## 10. Follow-up
- Checkpoint date (2026-02-17):
- Success criteria:
  - No new "totals>0 but queued=0" anomalies without explicit warning.
  - Backfill path remains idempotent under repeated runs.
  - Support flow can detect and explain this class of mismatch within minutes (not hours).
