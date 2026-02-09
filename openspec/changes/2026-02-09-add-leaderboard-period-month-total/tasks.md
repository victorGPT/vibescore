## 1. DB
- [x] 1.1 Add `vibeusage_leaderboard_source_month` and `vibeusage_leaderboard_source_total`
- [x] 1.2 Extend fallback SECURITY DEFINER functions to support `week|month|total`
- [x] 1.3 Add fallback views for `month` and `total` (entries + me, metric-aware)
- [ ] 1.4 Apply migration to Insforge2 and run `scripts/ops/insforge2-db-validate.cjs`

## 2. Backend (Edge Functions)
- [x] 2.1 `vibeusage-leaderboard`: accept `period=week|month|total` and compute correct windows
- [x] 2.2 `vibeusage-leaderboard-refresh`: default refresh `week+month`, allow `period=total`
- [x] 2.3 `vibeusage-leaderboard-settings`: sync snapshot display fields for `week+month+total` (best-effort)
- [x] 2.4 `vibeusage-leaderboard-profile`: accept `period` and fetch correct snapshot row
- [x] 2.5 Build `insforge-functions/` and run `npm test`
- [ ] 2.6 Deploy updated edge functions via Insforge2 MCP
- [ ] 2.7 Smoke: refresh `total` once and verify `GET vibeusage-leaderboard?period=total` returns 200

## 3. Dashboard (UI)
- [x] 3.1 Add period selector to `/leaderboard` and wire to API + URL query
- [x] 3.2 Profile links include `?period=...`; profile page follows selection
- [x] 3.3 Update mock data + API wrapper to support `period`
- [x] 3.4 Update copy registry keys for period labels and run validators

## 4. Automation
- [x] 4.1 Update 3-hour refresh workflow to refresh `week+month`
- [x] 4.2 Add daily refresh workflow for `total`

## 5. Verification
- [x] 5.1 `npm run validate:ui-hardcode`
- [x] 5.2 `npm run validate:copy`
- [x] 5.3 `npm --prefix dashboard test`
- [x] 5.4 `npm test`
