# PR Template (Minimal)

## PR Goal (one sentence)
Refine Matrix UI A styling, typography, and trend rendering, plus update install copy for a more consistent dashboard UI.

## Commit Narrative
- feat(ui): align Matrix UI A typography/spacing and panel styling
- feat(ui): adjust trend rendering for single-point and baseline behavior
- chore(copy): update install steps + copy button labels
- docs(openspec): update UI refactor change spec/tasks
- docs(pr): add PR gate record for this change

## Rollback Semantics
Reverting this PR restores the previous dashboard UI styling and behavior; no backend changes or data migrations.

## Hidden Context
- Mock "now" override only applies when mock mode is enabled.
- All user-visible strings remain sourced from `dashboard/src/content/copy.csv`.

## Regression Test Gate
### Most likely regression surface
- Dashboard render paths (trend chart, install module, details table sizing).
- Copy registry validation for updated strings.

### Verification method (choose at least one)
- [x] Existing automated checks: `node scripts/validate-copy-registry.cjs` => PASS with warnings (unused keys: `landing.meta.title`, `landing.meta.description`, `landing.meta.og_site_name`, `landing.meta.og_type`, `landing.meta.og_url`, `landing.meta.og_image`, `landing.meta.twitter_card`, `identity_card.operator_label`, `identity_panel.access_label`, `usage.summary.since`, `dashboard.session.label`)
- [x] Build: `npm --prefix dashboard run build` => PASS
- [ ] Manual regression path executed (steps + expected result)

### Uncovered scope
- Manual signed-in dashboard verification against live usage data.
- Cross-browser visual regression (Safari/Firefox).
