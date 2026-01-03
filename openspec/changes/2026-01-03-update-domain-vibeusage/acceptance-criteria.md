# Acceptance Criteria

## Feature: Migrate dashboard canonical domain to https://www.vibeusage.cc

### Requirement: Canonical host serves the dashboard
- Rationale: Users and crawlers must see a single canonical host.

#### Scenario: Canonical root loads
- WHEN a browser requests `https://www.vibeusage.cc/`
- THEN the response status SHALL be 200
- AND the response body SHALL contain the dashboard HTML shell

#### Scenario: Canonical path loads
- WHEN a browser requests `https://www.vibeusage.cc/wrapped-2025.html`
- THEN the response status SHALL be 200

### Requirement: Legacy hosts redirect permanently with path + query preserved
- Rationale: Preserve SEO value and user bookmarks while moving domains.

#### Scenario: Legacy root redirects
- WHEN a browser requests `https://vibescore.space/`
- THEN the response status SHALL be 301
- AND the `Location` header SHALL equal `https://www.vibeusage.cc/`

#### Scenario: Legacy path + query redirects
- WHEN a browser requests `https://www.vibescore.space/pricing?ref=1`
- THEN the response status SHALL be 301
- AND the `Location` header SHALL equal `https://www.vibeusage.cc/pricing?ref=1`

#### Scenario: Legacy Vercel host redirects
- WHEN a browser requests `https://vibescore.vercel.app/`
- THEN the response status SHALL be 301
- AND the `Location` header SHALL equal `https://www.vibeusage.cc/`

### Requirement: SEO artifacts reflect the canonical host
- Rationale: Avoid crawler confusion after domain migration.

#### Scenario: Sitemap and robots reference canonical host
- WHEN a crawler fetches `/robots.txt` and `/sitemap.xml` from the canonical host
- THEN the sitemap entry and all sitemap URLs SHALL start with `https://www.vibeusage.cc/`

#### Scenario: Static metadata uses canonical og:url
- GIVEN the dashboard is built via `npm --prefix dashboard run build`
- WHEN a crawler fetches `dashboard/dist/index.html`
- THEN the `og:url` meta tag SHALL equal `https://www.vibeusage.cc`
