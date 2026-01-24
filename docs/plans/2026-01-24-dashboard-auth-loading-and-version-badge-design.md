# Dashboard Auth Loading Guard + Version Badge Design

## Section 1: Problem, Goals, and Options

The dashboard currently flashes the Landing page after a hard refresh even when the user is already signed in. The root cause is that `App` renders Landing when `signedIn` is still false while InsForge auth is loading. We also need a reliable, visible indicator to confirm which build is deployed (especially for the refactor build vs. main). Goals: remove the landing flash for authenticated refresh, preserve existing auth flows, keep changes minimal, and add a small version badge that is safe for screenshots (hidden in screenshot mode). Non-goals: change authentication contracts, modify InsForge behavior, or overhaul routing.

**Option A (minimal guard in App):** Add an `authPending` check in `App` and render the loading shell until auth is resolved. Pros: smallest diff, no new abstractions. Cons: harder to test without a helper.

**Option B (extract helper + guard):** Add a tiny `resolveAuthGate()` helper used by `App` and write tests for it. Pros: testable, clear behavior, still minimal. Cons: adds a small module.

**Option C (route-level guard):** Move gating into `DashboardPage` or add a dedicated route guard. Pros: separation of concerns. Cons: larger change and higher risk.

Recommendation: **Option B** for testability with minimal change. Version badge will be a small UI component that reads `VITE_APP_VERSION` and falls back to `MODE`, and it will be hidden during screenshot mode.

## Section 2: Proposed Design, Data Flow, and Testing

**Auth Guard Design:** Introduce `dashboard/src/lib/auth-gate.js` with `resolveAuthGate({ publicMode, mockEnabled, sessionSoftExpired, signedIn, authPending }) -> "loading" | "landing" | "dashboard"`. In `App`, compute `authPending` using `insforgeLoaded`, `insforgeSignedIn`, and a tri-state `insforgeSession` (`undefined` means “not fetched yet”). If `authPending` is true, render the loading shell instead of Landing; otherwise keep the existing Landing vs Dashboard decision. This preserves existing behavior while removing the landing flash for signed-in refresh.

**Version Badge:** Add `dashboard/src/lib/app-version.js` with `getAppVersion(env)` returning `VITE_APP_VERSION` if set, otherwise `MODE`, otherwise `"unknown"`. Inject `VITE_APP_VERSION` from root `package.json` in `dashboard/vite.config.js` so production builds always show a concrete version without extra env setup. Add `VersionBadge` in `dashboard/src/ui/matrix-a/components/VersionBadge.jsx` using copy key `dashboard.version.label` and render it in `App` (fixed bottom-right). Hide the badge in screenshot mode to keep baseline images stable.

**Testing:** Add TDD tests for `resolveAuthGate` and `getAppVersion` using `test/helpers/load-dashboard-module`. Expected failing tests before implementation, then green. Manual check: refresh while logged in should show loading shell then dashboard (no landing), and version badge should display in normal mode and be hidden when `screenshot=1`.
