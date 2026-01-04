# Public Identifier Mapping (VibeScore -> VibeUsage)

## Brand
- Product name: `VibeScore` -> `VibeUsage`

## Domains
- Canonical: `https://www.vibeusage.cc`
- Legacy: `https://www.vibescore.space` -> 301 to canonical

## NPM Packages
- Primary CLI package: `vibeusage`
- Legacy CLI package: `@vibescore/tracker` (compatibility)
- Dashboard package: `@vibeusage/dashboard`

## CLI Binaries
- Primary: `vibeusage`
- Aliases: `vibeusage-tracker`, `tracker`, `vibescore-tracker`

## Environment Variables (CLI + Edge)
- `VIBEUSAGE_INSFORGE_BASE_URL` (fallback: `VIBESCORE_INSFORGE_BASE_URL`)
- `VIBEUSAGE_INSFORGE_ANON_KEY` (fallback: `VIBESCORE_INSFORGE_ANON_KEY`)
- `VIBEUSAGE_HTTP_TIMEOUT_MS` (fallback: `VIBESCORE_HTTP_TIMEOUT_MS`)
- `VIBEUSAGE_DASHBOARD_URL` (fallback: `VIBESCORE_DASHBOARD_URL`)
- `VIBEUSAGE_DEVICE_TOKEN` (fallback: `VIBESCORE_DEVICE_TOKEN`)
- `VIBEUSAGE_AUTO_RETRY_NO_SPAWN` (fallback: `VIBESCORE_AUTO_RETRY_NO_SPAWN`)
- `VIBEUSAGE_DEBUG` (fallback: `VIBESCORE_DEBUG`)
- `VIBEUSAGE_PRICING_MODEL` (fallback: `VIBESCORE_PRICING_MODEL`)
- `VIBEUSAGE_PRICING_SOURCE` (fallback: `VIBESCORE_PRICING_SOURCE`)
- `VIBEUSAGE_USAGE_MAX_DAYS` (fallback: `VIBESCORE_USAGE_MAX_DAYS`)
- `VIBEUSAGE_SLOW_QUERY_MS` (fallback: `VIBESCORE_SLOW_QUERY_MS`)
- `VIBEUSAGE_INGEST_MAX_INFLIGHT` (fallback: `VIBESCORE_INGEST_MAX_INFLIGHT`)
- `VIBEUSAGE_INGEST_RETRY_AFTER_MS` (fallback: `VIBESCORE_INGEST_RETRY_AFTER_MS`)

## Dashboard Env (Vite)
- `VITE_VIBEUSAGE_INSFORGE_BASE_URL` (fallback: `VITE_VIBESCORE_INSFORGE_BASE_URL`)
- `VITE_VIBEUSAGE_INSFORGE_ANON_KEY` (fallback: `VITE_VIBESCORE_INSFORGE_ANON_KEY`)
- `VITE_VIBEUSAGE_HTTP_TIMEOUT_MS` (fallback: `VITE_VIBESCORE_HTTP_TIMEOUT_MS`)

## Local Storage / Filesystem
- Root directory: `~/.vibescore/` -> `~/.vibeusage/`
- Tracker config: `~/.vibescore/tracker/` -> `~/.vibeusage/tracker/`
- Dashboard auth key: `vibescore.dashboard.auth.v1` -> `vibeusage.dashboard.auth.v1` (legacy read + migrate)
- Dashboard session key: `vibescore.dashboard.session_expired.v1` -> `vibeusage.dashboard.session_expired.v1` (legacy read + migrate)
- Dashboard cache keys: `vibescore.*` -> `vibeusage.*` (usage, trend, heatmap, model breakdown)

## API / Edge Functions
- Primary: `/functions/vibeusage-*`
- Legacy: `/functions/vibescore-*` (proxy to new handlers)
- Legacy fallback path: `/api/functions/*` still supported for 404 fallback

## Logging / Headers
- Device token hash header: `x-vibescore-device-token-hash` -> `x-vibeusage-device-token-hash` (legacy accepted)

## Compatibility Window
- All legacy identifiers remain functional for 90 days via transparent fallback/proxy.
