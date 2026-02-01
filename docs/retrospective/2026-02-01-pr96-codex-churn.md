# Postmortem: PR96 codex review churn
Report date (YYYY-MM-DD): 2026-02-01
Owner: codex
Audience: delivery team, engineering leads

## 1. Scope
- In scope: PR #96 (auth fallback when JWT secret missing for edge functions)
- Out of scope: unrelated test failures and other PRs
- Time window (YYYY-MM-DD -> YYYY-MM-DD): 2026-02-01 -> 2026-02-01

## 2. Goals & Plan (Before)
- Intended outcomes:
  - Allow remote auth when JWT secret is missing so project usage summary does not 401.
  - Add regression test for missing-secret fallback.
  - Deploy updated edge function.
- Planned milestones (each YYYY-MM-DD):
  - 2026-02-01: implement fix + test and merge.
- Key assumptions:
  - Codex review service available for standard @codex review loop.

## 3. Outcome vs Plan
- What shipped:
  - Auth fallback behavior in `getEdgeClientAndUserIdFast` when JWT secret missing.
  - Regression test for missing-secret fallback.
  - Edge function rebuilt and deployed.
- Deviations/gaps:
  - Codex review failed twice with "Something went wrong" and required retry.
- Metric deltas (if any):
  - Review cycles: 2 @codex review attempts + error responses.

## 4. Impact
- User/customer impact:
  - None from review churn (code change still merged same day).
- Business/ops impact:
  - Review loop delayed by Codex connector errors; manual merge decision required.
- Duration:
  - ~4 minutes on 2026-02-01.

## 5. Timeline (Detection -> Mitigation -> Resolution)
- Detection date (YYYY-MM-DD): 2026-02-01 (Codex connector error comment)
- Mitigation date (YYYY-MM-DD): 2026-02-01 (re-triggered @codex review)
- Resolution date (YYYY-MM-DD): 2026-02-01 (merged after thumbs-up reaction)

## 6. Evidence
- PR link: https://github.com/victorGPT/vibeusage/pull/96
- Codex review cycles: two @codex review comments + error responses from chatgpt-codex-connector
- Repro steps/tests:
  - node --test test/edge-functions.test.js --test-name-pattern "falls back to remote auth when jwt secret missing"

## 7. Root Causes (with Stage Attribution)
- Cause: Codex connector returned "Something went wrong" for review requests.
  - Stage (Primary): Release/Integration
  - Stage (Secondary): Review Packaging
  - Identified date (YYYY-MM-DD): 2026-02-01
  - Evidence: PR comments from chatgpt-codex-connector indicating unknown error

## 8. Action Items (Owner + Due Date)
- [ ] Add retry/hold logic in PR loop when Codex returns an error response (Owner: codex, Due 2026-02-03)
- [ ] Add explicit "Codex error" note to PR context when retrying (Owner: codex, Due 2026-02-03)

## 9. Prevention Rules
- Rule: Do not treat Codex error responses as review outcomes; require either a thumbs-up signal or success phrase.
  - Enforcement: PR loop must check for error phrases and force retry/wait.
  - Verification: PR loop log includes at least one successful review signal or explicit thumbs-up before merge.

## 10. Follow-up
- Checkpoint date (YYYY-MM-DD): 2026-02-03
- Success criteria:
  - No merges based on Codex error responses.
  - Retried review requests produce a valid review signal or an explicit manual override decision.
