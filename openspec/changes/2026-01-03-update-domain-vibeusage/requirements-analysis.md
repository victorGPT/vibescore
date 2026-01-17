# Requirement Analysis

## Goal
- Migrate the public dashboard canonical domain to `https://www.vibeusage.cc`.
- Redirect legacy domains to the canonical host with permanent (301) redirects that preserve path + query.
- Keep SEO artifacts (`og:url`, sitemap, robots) consistent with the canonical host.
- Hold deployment until the final domain is confirmed.

## Scope
- In scope:
  - Vercel domain configuration for canonical + legacy redirect hosts.
  - Dashboard static assets that embed domain references.
  - Documentation and OpenSpec updates.
- Out of scope:
  - Backend API or data layer changes.
  - New analytics, tracking, or UI changes.
  - Domain change for API endpoints or CLI base URLs.

## Users / Actors
- Web visitors.
- Search engines/crawlers.
- Vercel routing layer.
- Maintainers performing domain configuration.

## Inputs
- HTTP requests to canonical and legacy hosts.
- Path + query parameters.

## Outputs
- Canonical host serves the dashboard (HTTP 200).
- Legacy hosts return 301 redirects to the canonical host with path + query preserved.

## Business Rules
- `https://www.vibeusage.cc` is the canonical dashboard host.
- Legacy hosts (`vibescore.space`, `www.vibescore.space`, `vibescore.vercel.app`) are redirect-only.
- Redirects MUST be 301 and preserve path + query.
- Deployment is blocked until the final domain is confirmed.

## Assumptions
- Vercel supports host-based redirects and multiple domains per project.
- The canonical host remains `www.vibeusage.cc` unless explicitly changed.

## Dependencies
- Vercel project domain settings (external).
- Dashboard files: `dashboard/public/robots.txt`, `dashboard/public/sitemap.xml`, `dashboard/src/pages/DashboardPage.jsx`, `dashboard/wrapped-2025.html`, `dashboard/vercel.json`.
- Docs: `README.md`, `README.zh-CN.md`.
- Spec: `openspec/specs/vibeusage-tracker/spec.md`.

## Risks
- SEO regressions if canonical/redirect settings are inconsistent.
  - Mitigation: update `og:url`, sitemap, and robots to canonical host; verify with curl.
- Redirect loops or missing path/query preservation.
  - Mitigation: explicit host-based rules with `:path*` + query passthrough.
- Final domain change after proposal.
  - Mitigation: require confirmation before implementation or deployment.
