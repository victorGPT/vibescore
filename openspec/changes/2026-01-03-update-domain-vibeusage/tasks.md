## 1. Implementation
- [ ] 1.1 Confirm final canonical domain and update this change if it differs from `https://www.vibeusage.cc`.
- [ ] 1.2 Configure Vercel project domains: add `www.vibeusage.cc` and 301-redirect legacy hosts (`vibescore.space`, `www.vibescore.space`, `vibescore.vercel.app`) to the canonical host with path + query preserved.
- [ ] 1.3 Update canonical domain references in dashboard assets: `dashboard/public/robots.txt`, `dashboard/public/sitemap.xml`, `dashboard/wrapped-2025.html`, `dashboard/src/pages/DashboardPage.jsx`, `dashboard/vercel.json` (if host-based redirects are managed in config).
- [ ] 1.4 Update docs and specs: `README.md`, `README.zh-CN.md`, `openspec/specs/vibeusage-tracker/spec.md`.

## 2. Verification
- [ ] 2.1 Run `npm --prefix dashboard run build` and confirm `dashboard/dist/index.html` contains `og:url` set to `https://www.vibeusage.cc`.
- [ ] 2.2 Verify redirects with curl: `curl -I https://vibescore.space/`, `curl -I "https://www.vibescore.space/pricing?ref=1"`, `curl -I https://vibescore.vercel.app/`.
- [ ] 2.3 Verify canonical SEO assets with curl: `curl -I https://www.vibeusage.cc/robots.txt`, `curl -I https://www.vibeusage.cc/sitemap.xml`.
- [x] 2.4 Record regression statement and commands in `verification-report.md`.
