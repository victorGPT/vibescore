## ADDED Requirements
### Requirement: Legacy domains redirect to the canonical dashboard host
The dashboard SHALL use `https://www.vibeusage.cc` as the canonical host. Requests to `https://vibescore.space`, `https://www.vibescore.space`, or `https://vibescore.vercel.app` MUST return a 301 redirect to the canonical host, preserving the request path and query string.

#### Scenario: Legacy root redirects
- **WHEN** a browser requests `https://vibescore.space/`
- **THEN** the response status SHALL be 301
- **AND** the `Location` header SHALL equal `https://www.vibeusage.cc/`

#### Scenario: Legacy path + query redirects
- **WHEN** a browser requests `https://www.vibescore.space/pricing?ref=1`
- **THEN** the response status SHALL be 301
- **AND** the `Location` header SHALL equal `https://www.vibeusage.cc/pricing?ref=1`

#### Scenario: Legacy Vercel host redirects
- **WHEN** a browser requests `https://vibescore.vercel.app/`
- **THEN** the response status SHALL be 301
- **AND** the `Location` header SHALL equal `https://www.vibeusage.cc/`

### Requirement: SEO assets reference the canonical host
The public `robots.txt` and `sitemap.xml` SHALL reference the canonical host `https://www.vibeusage.cc`.

#### Scenario: Robots and sitemap use canonical host
- **WHEN** a crawler fetches `/robots.txt` and `/sitemap.xml` from the canonical host
- **THEN** the sitemap entry and all sitemap URLs SHALL start with `https://www.vibeusage.cc/`

## MODIFIED Requirements
### Requirement: Landing page serves static social metadata
The dashboard landing page HTML SHALL include Open Graph and Twitter card metadata in the initial HTML response, without requiring client-side JavaScript execution. The metadata values SHALL be sourced from the copy registry `landing.meta.*`, and `og:url` SHALL be `https://www.vibeusage.cc`.

#### Scenario: Crawler reads static meta tags
- **GIVEN** the dashboard is built via `npm --prefix dashboard run build`
- **WHEN** a crawler fetches `dashboard/dist/index.html`
- **THEN** the HTML SHALL include `meta` tags for `description`, `og:title`, `og:description`, `og:image`, `og:site_name`, `og:type`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- **AND** the `content` values SHALL match the copy registry `landing.meta.*` entries
- **AND** `og:url` SHALL equal `https://www.vibeusage.cc`
