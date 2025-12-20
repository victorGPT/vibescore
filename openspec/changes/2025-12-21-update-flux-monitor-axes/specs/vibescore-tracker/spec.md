## ADDED Requirements
### Requirement: Flux monitor shows axes and stays aligned with Zion_Index
The dashboard SHALL render a flux monitor with X/Y axes and tick labels, and SHALL keep the flux monitor's data range and labeling aligned with the Zion_Index period selection.

#### Scenario: Period switch updates axes and data
- **GIVEN** the user is signed in and viewing the dashboard
- **WHEN** the user switches the Zion_Index period (day/week/month/total)
- **THEN** the flux monitor SHALL update its X-axis range label to match the Zion_Index range
- **AND** the flux monitor SHALL render values derived from the same daily usage data slice

#### Scenario: Minimal display when no data
- **GIVEN** the user has no daily usage data for the selected period
- **WHEN** the dashboard renders the flux monitor
- **THEN** the flux monitor SHALL show a minimal empty-state while retaining axis context or labels as configured

#### Scenario: Panel label uses trend naming
- **GIVEN** the dashboard renders the flux monitor
- **WHEN** the user views the panel header
- **THEN** the label SHALL read `Trend`
