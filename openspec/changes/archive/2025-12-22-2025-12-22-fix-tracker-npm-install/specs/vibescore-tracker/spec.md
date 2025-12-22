# Spec Delta: vibescore-tracker

## ADDED Requirements
### Requirement: Public npm distribution for CLI
The system SHALL publish `@vibescore/tracker` to the public npm registry so users can run `npx --yes @vibescore/tracker <command>` without npm authentication.

#### Scenario: Public install via npx
- **WHEN** a user runs `npx --yes @vibescore/tracker --help` in a clean npm environment
- **THEN** the package SHALL download successfully and print CLI help without `404` or `403` errors
