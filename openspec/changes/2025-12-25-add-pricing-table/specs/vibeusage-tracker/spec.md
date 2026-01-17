## ADDED Requirements
### Requirement: Pricing profiles are stored in a table
The system SHALL store pricing profiles in a database table with an effective date, so cost calculation is data-driven.

#### Scenario: Table row defines pricing
- **GIVEN** a pricing table row exists with `effective_from <= today`
- **WHEN** the system computes usage cost
- **THEN** it SHALL use the rates from that row

### Requirement: Pricing resolver falls back to default profile
The system MUST fall back to the built-in default pricing profile when no valid table rows are available.

#### Scenario: Empty table
- **GIVEN** the pricing table is empty
- **WHEN** a usage endpoint computes cost
- **THEN** it SHALL use the default pricing profile

### Requirement: Pricing metadata reflects the resolved profile
Usage endpoints that return cost SHALL include pricing metadata derived from the resolved profile.

#### Scenario: Metadata matches table profile
- **GIVEN** a pricing table row is selected
- **WHEN** a usage endpoint responds
- **THEN** the response `pricing` SHALL match the row's model/source/rates/effective_from
