# Design: Frontend Foundation Refactor

## Goals
- Preserve all existing UI styles and behavior.
- Preserve all displayed data semantics and formatting.
- Rebuild frontend architecture from first principles.
- Enforce single source of truth for displayed data and copy.
- Optimize for maintainability and future extensibility.
- Keep the architecture **simple** and avoid unnecessary layers.

## Non-Goals
- No backward compatibility for legacy APIs or data shapes.
- No feature changes beyond refactor scope.
- No phased dual-path migration.

## Constraints (Hard)
- Routes unchanged: `/` and `/share/:token`.
- `copy.csv` is frozen and authoritative; `copy.jsx` included in baseline.
- Visual parity validated by automated baselines using **agent-browser**.
- Baseline viewports: **1440×900** and **390×844**.
- Baseline scenarios: Landing (unauth), Dashboard (auth, default mock), Share page.
- Visual diff threshold: **0.1%**.
- Freeze time/random/timezone; disable animations during baseline.
- Localize external assets for stable rendering.
- Mock baseline data lives at `dashboard/src/mock/data.json` and is enabled via `VITE_USE_MOCK=1`.

## Simplicity Rules
- Prefer local component state; use global stores only for true cross-cutting state.
- One source of truth per metric/copy; no parallel derivations.
- Avoid deep abstraction layers; keep feature boundaries clear.

## Architecture (Proposed, Minimal)

### Tech Choices
- **TypeScript** for all frontend code.
- **Zustand** only for cross-cutting state (auth + UI preferences).
- **TanStack Query** for server data (no manual cache logic).
- **Tailwind + Matrix UI components** preserved; only add types.

### Directory Structure (concise)
```
dashboard/src/
├── main.tsx
├── App.tsx
├── providers/               # QueryClient + Auth
├── types/                   # API + domain + UI types
├── stores/                  # Minimal global state (auth, ui)
├── api/                     # Client + queries + mutations
├── features/                # auth, dashboard, identity, install
├── ui/matrix-a/             # Existing UI components (typed only)
├── lib/                     # Pure utilities
├── styles/
└── mock/data.json           # Baseline mock data
```

## Data Flow
- In baseline mode (`VITE_USE_MOCK=1`), all data loads from `mock/data.json`.
- In production mode, TanStack Query pulls from edge functions.
- Derived values are computed once, with clear ownership per feature.

## Migration Strategy
- **One-time cutover**: build the new architecture in parallel, then replace the old entry points in a single switch.
- No dual-path logic inside runtime; old code is removed at cutover.

## Verification
- agent-browser generates baseline screenshots for the three scenarios.
- Freeze time/random/timezone + disable animations for stable diffs.
- Visual diffs must be <= 0.1%.
- Copy parity checked against frozen `copy.csv`.
