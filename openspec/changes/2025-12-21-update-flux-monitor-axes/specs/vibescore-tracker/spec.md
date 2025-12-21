## ADDED Requirements
### Requirement: Trend monitor uses the v2 TUI layout
The dashboard SHALL render the Trend monitor using the provided v2 TUI layout, including axes, grid, scan sweep, and period-based X-axis labels.

#### Scenario: Trend monitor renders with period-based X-axis labels
- **GIVEN** the user is signed in and viewing the dashboard
- **WHEN** the user switches the Zion_Index period (day/week/month/total)
- **THEN** the X-axis SHALL show hours for `day`, dates for `week/month`, and months for `total`
- **AND** the Trend monitor SHALL render values derived from the same daily usage data slice

#### Scenario: Minimal display when no data
- **GIVEN** the user has no daily usage data for the selected period
- **WHEN** the dashboard renders the Trend monitor
- **THEN** the Trend monitor SHALL still render axes, grid, and labels with a flat signal

#### Scenario: Panel label uses trend naming
- **GIVEN** the dashboard renders the Trend monitor
- **WHEN** the user views the panel header
- **THEN** the label SHALL read `Trend`
