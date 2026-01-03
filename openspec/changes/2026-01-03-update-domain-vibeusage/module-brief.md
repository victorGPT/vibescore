# Module Brief: Domain Migration + Legacy Redirects

## Scope
- IN: Canonical host migration to `https://www.vibeusage.cc`, legacy host redirects, SEO asset updates, documentation updates.
- OUT: Backend APIs, data model changes, CLI configuration, analytics, or UI redesign.

## Interfaces
- Input: HTTP requests (host, path, query), Vercel domain configuration.
- Output: 200 responses on canonical host or 301 redirects on legacy hosts.

## Data Flow and Constraints
- Vercel receives the request and evaluates host-based rules.
- Legacy hosts must issue a 301 redirect to `https://www.vibeusage.cc` with path + query preserved.
- Canonical host serves the dashboard assets directly.

## Non-Negotiables
- Canonical host is `https://www.vibeusage.cc`.
- Redirects are permanent (301) and preserve path + query.
- No deploy until the final domain is confirmed.

## Test Strategy
- Integration: `curl -I` checks for 301 + `Location` preservation.
- Build: `npm --prefix dashboard run build` then verify `og:url`.

## Milestones
- M1: Requirements + acceptance.
- M2: Proposal + spec delta.
- M3: Implementation (post confirmation).
- M4: Verification + regression statement.

## Plan B Triggers
- If Vercel cannot enforce host-based redirects, create a separate Vercel redirect project for legacy domains.

## Upgrade Plan (disabled)
- None.
