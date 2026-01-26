## MODIFIED Requirements

### Requirement: Frontend Refactor With UI/Data Parity
The system SHALL rebuild the frontend implementation while preserving all existing UI styles and displayed data semantics.

#### Scenario: UI parity (baseline)
- **WHEN** a user visits any frontend page in baseline mode
- **THEN** layout, typography, colors, spacing, and interaction behavior match current production UI
- **AND** automated screenshot baselines (agent-browser) show <= 0.1% visual diff
- **AND** screenshots are captured at 1440×900 and 390×844 viewports
- **AND** time/random/timezone are frozen and animations are disabled

#### Scenario: Data semantics parity
- **WHEN** a user views displayed metrics or summaries
- **THEN** values, formatting, and meaning match current production outputs
- **AND** all baseline data is sourced from `dashboard/src/mock/data.json`

### Requirement: Single Source of Truth for Displayed Data and Copy
The system SHALL define a single authoritative source for each displayed metric and copy entry.

#### Scenario: Authoritative metric
- **WHEN** a displayed metric is used in multiple views
- **THEN** all views use the same authoritative data source and rules

#### Scenario: Authoritative copy
- **WHEN** UI text is rendered
- **THEN** content MUST come from frozen `copy.csv`

### Requirement: Routes Must Remain Unchanged
The system SHALL keep `/` and `/share/:token` routes unchanged.

#### Scenario: Route preservation
- **WHEN** a user navigates to `/` or `/share/:token`
- **THEN** the new frontend serves the same page and content as the legacy frontend
