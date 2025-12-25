## 1. Spec
- [x] Add UI component requirements to spec delta.
- [x] Confirm mainstream titles for map + modal.
- [x] Update requirements to include dashboard integration.

## 2. UI Components
- [x] Add `MatrixConstants`, `NeuralAdaptiveFleet`, `NeuralDivergenceMap`, `CostAnalysisModal` to UI library.
- [x] Replace all visible strings with `copy()` keys.
- [x] Add new copy entries to `dashboard/src/content/copy.csv`.
- [x] Add model breakdown API helper + hook + mock data.
- [x] Wire model breakdown map + cost modal into `DashboardPage`.

## 3. Verification
- [x] Manual render check in dashboard dev (component story or temporary mount).
- [x] `node scripts/validate-copy-registry.cjs`.
