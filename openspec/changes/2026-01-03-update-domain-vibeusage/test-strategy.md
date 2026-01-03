# Test Strategy

## Objectives
- Confirm the canonical host serves the dashboard.
- Ensure legacy hosts redirect with 301 and preserve path + query.
- Validate SEO artifacts (`og:url`, sitemap, robots) use the canonical host.

## Test Levels
- Unit:
  - Optional static checks for canonical domain references in `robots.txt`, `sitemap.xml`, and `dashboard/dist/index.html`.
- Integration:
  - `curl -I` checks for 301 redirects and `Location` headers.
- Regression:
  - Existing dashboard build checks (`npm --prefix dashboard run build`).

## Test Matrix
- Canonical root -> Integration -> 200
- Legacy root -> Integration -> 301 + Location
- Legacy path + query -> Integration -> 301 + Location w/ preserved query
- Sitemap/robots -> Unit/Manual -> canonical host present
- og:url -> Build artifact check -> canonical host present

## Environments
- Vercel production domain for redirect verification.
- Local dashboard build for metadata checks.

## Automation Plan
- Add a lightweight script or test to assert canonical URLs in `robots.txt`/`sitemap.xml` (optional).
- Use `curl -I` for redirect verification once domains are configured.

## Entry / Exit Criteria
- Entry: OpenSpec change approved and final domain confirmed.
- Exit: Acceptance criteria met; regression statement recorded.

## Coverage Risks
- Redirect verification depends on DNS propagation.
- Build-time `og:url` check requires a successful dashboard build.
