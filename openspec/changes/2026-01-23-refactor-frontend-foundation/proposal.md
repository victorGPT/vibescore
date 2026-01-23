# Change: Refactor Frontend Foundation (Preserve UI/Data)

## Why
The current frontend has accumulated technical debt and is hard to change safely. We need a clean rebuild that preserves UI styles and displayed data semantics, with a provable, automated baseline.

## What Changes
- **BREAKING**: Replace the current frontend implementation with a new architecture.
- Preserve **all** existing UI styles, layouts, and visual behavior across all frontend pages.
- Preserve **all** displayed data semantics and formatting.
- Enforce **single source of truth** for displayed metrics and copy.
- **No backward compatibility** or dual-path logic.
- Establish automated visual baselines using **agent-browser** with **mock data**.

## Decisions (Confirmed)
- Scope: **all frontend** (dashboard) + `copy.jsx` included in baseline.
- Routes unchanged: `/` and `/share/:token`.
- Mock baseline: `dashboard/src/mock/data.json` + `VITE_USE_MOCK=1`.
- Viewports: **1440×900** (desktop), **390×844** (mobile).
- Scenarios: Landing (unauth), Dashboard (auth, default mock), Share page.
- Visual diff threshold: **0.1%**.
- Freeze time/random/timezone; disable animations during baseline.
- Localize external assets (fonts/icons/images) for stable baselines.
- **TypeScript** for all frontend code.
- One-time cutover (no phased dual implementation).
- Copy system: `copy.csv` is frozen and authoritative.

## Impact
- Affected spec: `vibeusage-tracker`
- Affected code: `dashboard/` (all frontend entry points)
