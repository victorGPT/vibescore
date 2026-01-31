# Change: Add project usage dashboard cards

## Why
Users need a quick, visual view of token usage per GitHub repository without leaving the dashboard.

## What Changes
- Add a project usage summary edge function for top repositories by tokens.
- Add a dashboard panel that renders GitHub-style repository cards.
- Add copy registry entries for the new UI.

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `insforge-src/functions`, `dashboard/src`, `dashboard/src/content/copy.csv`
