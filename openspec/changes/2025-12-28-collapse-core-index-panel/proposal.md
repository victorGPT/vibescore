# Change: Collapse CORE_INDEX breakdown modules by default

## Why
The CORE_INDEX panel is visually dense on mobile. Collapsing the four breakdown modules by default improves legibility and reduces vertical clutter while keeping the main summary value visible and accessible.

## What Changes
- Add a collapse/expand toggle icon in the CORE_INDEX panel header.
- Default the breakdown modules to collapsed on first render.
- When collapsed, hide only the four breakdown modules; keep the summary value visible. When expanded, render the current layout.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `dashboard/src/ui/matrix-a/components/UsagePanel.jsx`, `dashboard/src/pages/DashboardPage.jsx`, `dashboard/src/content/copy.csv`
