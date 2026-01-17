# Change: Finalize VibeUsage rename (remove VibeScore compatibility)

## Why
Legacy VibeScore paths keep reappearing and cause runtime confusion and failures. We need a single source of truth for naming, endpoints, and storage paths.

## What Changes
- **BREAKING**: Remove `vibescore-*` endpoints, env fallbacks, and CLI aliases.
- Rename DB objects from `vibescore_*` to `vibeusage_*` with a reversible migration.
- Update CLI/dashboard/scripts/docs to use only `vibeusage` naming.
- Add a runtime guard that fails if `vibescore` appears in runtime code paths.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `src/`, `dashboard/`, `insforge-src/`, `scripts/`, `BACKEND_API.md`, `README*`
