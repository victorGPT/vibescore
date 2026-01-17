# Test Strategy

## Unit tests
- CLI runtime config ignores `VIBESCORE_*`.
- Dashboard config ignores `VITE_VIBESCORE_*`.
- Runtime guard fails if `vibescore` is present in runtime paths.

## Integration / contract
- Edge functions respond under `vibeusage-*` slugs only.
- DB rename script preserves row counts.

## Smoke
- `node scripts/smoke/insforge-smoke.cjs` uses `VIBEUSAGE_*` envs only.
