# Module Brief: Finalize VibeUsage Rename

## Scope
IN: CLI/runtime naming, edge function slugs, DB object names, dashboard envs/keys, scripts and docs.
OUT: Feature behavior changes, new endpoints, pricing logic changes.

## Interfaces
- CLI -> Edge Functions: `vibeusage-*`
- Dashboard -> Edge Functions: `vibeusage-*`
- DB tables/functions/views: `vibeusage_*`

## Data flow & constraints
- Rename DB objects without data loss; keep migrations reversible.
- Remove all `VIBESCORE_*` env fallbacks.

## Non-negotiables
- No legacy `vibescore` runtime references after completion.

## Test strategy
- Unit tests for env + runtime guard; integration for edge slugs; verification for DB rename.

## Milestones
1) Spec + guard in place
2) CLI + dashboard renamed
3) Edge + DB rename + scripts updated
4) Tests + deployment

## Plan B triggers
- DB rename cannot be completed in maintenance window -> revert using rollback script.
