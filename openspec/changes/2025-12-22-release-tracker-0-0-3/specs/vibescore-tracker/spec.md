# Spec Delta: vibescore-tracker

## ADDED Requirements
### Requirement: Debug output includes backend status and code
When debug mode is enabled, the CLI SHALL surface backend status and error code to aid troubleshooting.

#### Scenario: Debug output shows status and code
- **GIVEN** `VIBESCORE_DEBUG=1`
- **WHEN** `npx --yes @vibescore/tracker sync` encounters a backend error
- **THEN** stderr SHALL include `Status:` and `Code:` when available
