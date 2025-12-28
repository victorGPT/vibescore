## ADDED Requirements

### Requirement: Dashboard CORE_INDEX breakdown modules are collapsible by default
The dashboard UI SHALL render the CORE_INDEX breakdown modules in a collapsed state by default, while keeping the summary value visible until expanded by the user.

#### Scenario: Default collapsed state keeps summary visible
- **WHEN** a user loads the dashboard
- **THEN** the CORE_INDEX panel SHALL show only the header row and a collapse/expand icon
- **AND** the index summary value SHALL remain visible
- **AND** the four breakdown modules SHALL be hidden

#### Scenario: Expand and collapse toggle reveals breakdown modules
- **GIVEN** the CORE_INDEX breakdown modules are collapsed
- **WHEN** the user activates the toggle icon
- **THEN** the CORE_INDEX panel SHALL render the four breakdown modules
- **AND** activating the toggle again SHALL hide the breakdown modules while keeping the summary value visible
