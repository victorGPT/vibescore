# Change: Migrate dashboard canonical domain to https://www.vibeusage.cc

## Why
- Align the public dashboard domain with the new brand.
- Preserve SEO and user experience by redirecting legacy domains.

## What Changes
- Configure the Vercel project to serve `https://www.vibeusage.cc` as the canonical host.
- Add permanent (301) redirects from `https://vibescore.space`, `https://www.vibescore.space`, and `https://vibescore.vercel.app` to the canonical host, preserving path + query.
- Update dashboard assets and docs to reference the canonical domain (og:url, sitemap, robots, README).
- Update OpenSpec requirements for canonical domain + legacy redirects.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `dashboard/public/robots.txt`, `dashboard/public/sitemap.xml`, `dashboard/wrapped-2025.html`, `dashboard/src/pages/DashboardPage.jsx`, `dashboard/vercel.json`, `README.md`, `README.zh-CN.md`, `openspec/specs/vibeusage-tracker/spec.md`
- **BREAKING**: none (legacy domains redirect)

## Risks & Mitigations
- Risk: SEO confusion if canonical/redirect settings diverge. Mitigation: 301 redirects + `og:url` + sitemap/robots updated and verified.
- Risk: Redirect loops. Mitigation: host-based redirect rules with explicit destination host.
- Risk: Final domain still pending. Mitigation: do not deploy until the final domain is confirmed; update this change before implementation.

## Rollout / Milestones
- M1: Requirements + acceptance complete.
- M2: OpenSpec proposal + spec deltas drafted.
- M3: Implementation (no deploy until final domain confirmed).
- M4: Verification + regression statement recorded.
