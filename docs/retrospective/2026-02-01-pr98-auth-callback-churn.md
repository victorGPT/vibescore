# Postmortem: PR98 auth callback redirect churn
Report date (YYYY-MM-DD): 2026-02-01
Owner: codex
Audience: delivery team, engineering leads

## 1. Scope
- In scope: PR #98 (auth callback redirect + Insforge afterSignInUrl changes)
- Out of scope: unrelated dashboard UI work and backend data pipelines
- Time window (YYYY-MM-DD -> YYYY-MM-DD): 2026-02-01 -> 2026-02-01

## 2. Goals & Plan (Before)
- Intended outcomes:
  - Redirect users from naked `/auth/callback` to `/sign-in` to recover missing tokens.
  - Ensure Insforge sign-in redirects to `/auth/callback`.
  - Add regression tests for auth callback behavior.
- Planned milestones (each YYYY-MM-DD):
  - 2026-02-01: implement fix + tests and merge.
- Key assumptions:
  - Session storage access is available in browsers used by the dashboard.
  - Auth callback redirect can run immediately without waiting for session hydration.

## 3. Outcome vs Plan
- What shipped:
  - Auth callback fallback redirect with retry guard.
  - Safe sessionStorage access with memory fallback.
  - Deferred redirect until auth session hydration resolves.
  - Unit tests covering storage errors and hydration gating.
- Deviations/gaps:
  - Required multiple Codex review cycles due to missing edge cases (storage access throws, premature redirect).
- Metric deltas (if any):
  - Review cycles: 3 @codex review requests + 2 follow-up fixes.

## 4. Impact
- User/customer impact:
  - None in production (changes not deployed before merge).
- Business/ops impact:
  - Review loop delayed while addressing edge cases flagged by Codex.
- Duration:
  - ~40 minutes on 2026-02-01.

## 5. Timeline (Detection -> Mitigation -> Resolution)
- Detection date (YYYY-MM-DD): 2026-02-01 (Codex P2 feedback on storage access and hydration)
- Mitigation date (YYYY-MM-DD): 2026-02-01 (added safe storage access + hydration gating)
- Resolution date (YYYY-MM-DD): 2026-02-01 (Codex thumbs-up, merged)

## 6. Evidence
- PR link: https://github.com/victorGPT/vibeusage/pull/98
- Codex review cycles: P2 comments on storage access + hydration gating, then thumbs-up
- Repro steps/tests:
  - npm --prefix dashboard test -- src/lib/__tests__/auth-callback.test.ts

## 7. Root Causes (with Stage Attribution)
- Cause: Auth callback redirect ran before session hydration and assumed sessionStorage access was safe.
  - Stage (Primary): Implementation
  - Stage (Secondary): Testing
  - Identified date (YYYY-MM-DD): 2026-02-01
  - Evidence: Codex review comments requesting storage guards and hydration gating

## 8. Action Items (Owner + Due Date)
- [ ] Document auth callback invariants in spec or design notes (Owner: codex, Due 2026-02-03)
- [ ] Keep auth callback tests covering storage errors and hydration gating (Owner: codex, Due 2026-02-03)

## 9. Prevention Rules
- Rule: Auth callback redirect must wait for session hydration and never assume storage access.
  - Enforcement: `shouldRedirectFromAuthCallback` requires `sessionResolved` and uses safe storage accessors.
  - Verification: `auth-callback.test.ts` includes tests for storage errors and session gating.

## 10. Follow-up
- Checkpoint date (YYYY-MM-DD): 2026-02-03
- Success criteria:
  - No new auth callback regressions reported.
  - Tests remain green with storage/hydration scenarios.
