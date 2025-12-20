# Change: Update flux monitor axes and linkage

## Why
The Neural_Flux_Monitor currently shows an animated graph without explicit axes and can feel visually noisy. It also does not clearly communicate its relationship to the Zion_Index period/range, which reduces interpretability.

## What Changes
- Add X/Y axes with tick labels to the flux monitor for readability.
- Tie the flux monitor's data range and labeling to the Zion_Index period selection.
- Rename the module label using an industry-standard trend naming (chosen: `Trend`).

## Impact
- Affected specs: `specs/vibescore-tracker/spec.md`
- Affected code: `dashboard/src/ui/matrix-a/components/NeuralFluxMonitor.jsx`, `dashboard/src/pages/DashboardPage.jsx`
