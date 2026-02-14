---
repo: vibeusage
layer: fullstack
module: leaderboard-public-view
severity: S2
design_mismatch: yes
detection_gap: yes
reusable_for:
  - leaderboard
  - public share
  - mobile navigation
  - auth-gate
owner: Victor
status: mitigated
report_date: 2026-02-14
incident_window: 2026-02-14..2026-02-14
---

# Postmortem: Leaderboard Public View Clickability + Mobile Landing Fallback

## L2 Brief (2 min)
- **What happened:** Leaderboard rows and mobile navigation had inconsistent behavior: non-public users could still be navigated, and on mobile returning to dashboard could drop into landing/auth flow.
- **Why design mismatched reality:** Clickability was inferred from display text (`Anonymous`) instead of explicit access state, and some nav paths used full-page reload (`<a href>`), which re-entered auth gating.
- **Why not detected early:** Validation covered desktop and backend correctness, but not mobile route transitions + exact tapped element distinction.
- **What fixed it:** Added explicit `is_public` snapshot state (`leaderboard_public && active public link`), enforced it in API/UI, standardized token shape (`pv1-<uuid>`), and replaced full reload back-nav with SPA navigation.
- **When to read this next time:** Any changes touching leaderboard row linking, public share tokens, auth gating, or mobile navigation.

## 1. Scope
- In scope:
  - Leaderboard row clickability rules.
  - Public share token contract and resolve path.
  - Mobile navigation from `/leaderboard` to dashboard/public share routes.
  - Snapshot refresh/backfill behavior after rule change.
- Out of scope:
  - Pricing/usage computation logic.
  - Non-leaderboard dashboard feature behavior.

## 2. Plan Before Incident
- Intended outcomes:
  - Public users are linkable from leaderboard to `/share/...`.
  - Non-public users remain anonymous and non-linkable.
  - Mobile and desktop navigation behave consistently.
- Key assumptions:
  - `display_name === "Anonymous"` was sufficient proxy for non-linkable rows.
  - Hard navigation (`href`) would not materially affect auth state on mobile.

## 3. Outcome vs Plan
- Actual outcome:
  - Linkability logic leaked through edge cases where state was not explicitly represented.
  - Mobile path re-entered landing/auth in specific transitions.
- Deviations/gaps:
  - We relied on presentation field inference, not authorization state.
  - We fixed row navigation first, then discovered user was tapping the header “$ dashboard” button.

## 4. Impact
- User/business impact:
  - Confusing UX: “can enter but empty fields” / unexpected landing redirect on mobile.
  - Temporary trust hit in leaderboard/public profile flow.
- Ops/debug impact:
  - Multiple rapid patches and redeploys in one window.
  - Additional refresh backfills required after snapshot contract change.

## 5. Timeline
- Detection:
  - Public-view behavior discrepancy and mobile relogin/landing reports from production thread.
- Mitigation:
  - Public token contract hardened to `pv1-<uuid>` only.
  - Added explicit `is_public` to snapshot and UI clickability gate.
  - Forced hard-nav for row links; route detection broadened for `/share` variants.
  - Header back button changed from `<a href="/">` to SPA `navigate("/")`.
- Resolution:
  - Deployed leaderboard + refresh functions.
  - Applied DB migration and refreshed snapshots (`week/month/total`).

## 6. Evidence
- Key commits:
  - `f8712f4` fix leaderboard public name resolution from profile data
  - `d5b09df` leaderboard row opens public dashboard for public users
  - `426af6f` canonicalize to `pv1` token only (no legacy 64-hex compatibility)
  - `7094b6b` enforce `is_public` for leaderboard clickability
  - `70e6da4` hard-nav row link + period-only query pass-through
  - `6b54ca0` robust share-route detection on mobile
  - `265836c` use SPA navigation for leaderboard header dashboard button
- Deploy evidence:
  - `vibeusage-leaderboard` updated `2026-02-14T15:50:26.641Z`
  - `vibeusage-leaderboard-refresh` updated `2026-02-14T15:50:27.195Z`
- Refresh/backfill evidence:
  - week inserted `54`
  - month inserted `60`
  - total inserted `104`

## 7. Root Causes
- Primary:
  - Clickability authorization was derived from display-layer signal (`Anonymous`) instead of explicit access state.
- Secondary:
  - Public-visibility contract did not encode “has active public link” directly in snapshot payload.
- Tertiary:
  - Mobile path included full-page navigation in leaderboard header, causing auth-gate re-entry.
- Stage attribution:
  - Design: access-state modeling gap.
  - Frontend integration: navigation semantics mismatch.
  - QA: mobile user-journey coverage gap.

## 8. Action Items
- [ ] Add e2e case: mobile `leaderboard -> row public share -> back/dashboard` does not hit landing unexpectedly. (Owner: Victor, Due: 2026-02-16)
- [ ] Add contract test: leaderboard entries must expose explicit `is_public` and UI clickability must only depend on it. (Owner: Victor, Due: 2026-02-16)
- [ ] Add lint/rule-of-thumb doc: avoid `<a href="/">` for in-app nav in authenticated SPA flows. (Owner: Victor, Due: 2026-02-17)
- [ ] Add support runbook snippet: when changing snapshot authorization fields, always run `week/month/total` refresh and verify counts. (Owner: Victor, Due: 2026-02-16)

## 9. Prevention Rules
- Rule 1: Authorization decisions must be based on explicit backend state fields, never display-name heuristics.
- Rule 2: Public profile linkability requires both `leaderboard_public=true` and active non-revoked link.
- Rule 3: Authenticated SPA navigation should use router navigation, not hard reload, unless intentionally leaving SPA context.
- Enforcement:
  - API contract tests + UI clickability tests.
  - Mobile regression scenario in release checklist.

## 10. Follow-up
- Checkpoint date: 2026-02-17
- Success criteria:
  - No reproduction of mobile landing fallback in leaderboard path.
  - Non-public leaderboard rows are never clickable and never leak stable user identifiers.
  - Public rows consistently resolve to share view without re-auth surprises.
