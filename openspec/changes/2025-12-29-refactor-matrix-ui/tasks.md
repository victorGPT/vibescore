# Tasks

## 1. Scope confirmation
- [x] Confirm scope is limited to the Dashboard Matrix UI A theme (no data logic changes).

## 2. Typography + design tokens
- [x] Add Geist Mono font loading for the dashboard.
- [x] Define typography tokens (display/heading/body/caption) and color hierarchy variables in `dashboard/src/styles.css`.
- [x] Add utility classes for type scale and shared panel styling (smoked glass).

## 3. Component sweep
- [x] Update `AsciiBox` framing to smoked-glass styling and new heading/caption scale.
- [x] Update `MatrixShell` base typography and layout density to match the new scale.
- [x] Update key components (UsagePanel, IdentityCard, TrendMonitor, ActivityHeatmap, Leaderboard, Modals, Buttons/Inputs) to use the new type scale and color hierarchy.

## 4. Verification
- [x] Run dashboard smoke checks and record results (dev + visual spot-check or build).

## 5. Mock data controls
- [x] Add a mock "now" override to validate week-start behavior (Monday) during UI review.
