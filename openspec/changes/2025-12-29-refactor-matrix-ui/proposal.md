# Change: Refactor Matrix UI typography and component system

## Why
The current Matrix UI relies on many ad-hoc font sizes, spacing rules, and color accents. This causes inconsistent hierarchy and makes component scale harder to maintain. We need a unified typographic system, tighter component sizing, and a modern smoked-glass module treatment to match the desired aesthetic.

## What Changes
- Introduce typography tokens for display, heading, body, and caption.
- Standardize component spacing and sizing to align with the new scale.
- Apply a smoked-glass module style (dark translucent, blur, thin border) across panels.
- Add Geist Mono as the primary UI font.
- Normalize color hierarchy: primary highlight for core data, secondary/muted for labels.

## Impact
- Affected specs: `vibeusage-tracker` (UI visual system only; no data logic changes)
- Affected code: `dashboard/src/styles.css`, `dashboard/src/ui/matrix-a/**/*`, `dashboard/package.json`
- Copy registry: no text changes expected; `dashboard/src/content/copy.csv` remains unchanged
