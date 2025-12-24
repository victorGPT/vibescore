# Acceptance Criteria

## Feature: DETAILS pagination and trimming

### Requirement: DETAILS paginates `day` and `total` with 12 rows per page
- Rationale: Keep the details list scannable and consistent across periods.

#### Scenario: Day details paginate
- **GIVEN** the user selects `day` and there are more than 12 hourly rows
- **WHEN** the DETAILS table renders
- **THEN** it SHALL show 12 rows per page
- **AND** it SHALL render prev/next controls and page indicator

#### Scenario: Total details paginate
- **GIVEN** the user selects `total` and there are more than 12 monthly rows
- **WHEN** the DETAILS table renders
- **THEN** it SHALL show 12 rows per page
- **AND** it SHALL render prev/next controls and page indicator

### Requirement: DETAILS hides future buckets
- Rationale: Future data is misleading and should never be shown.

#### Scenario: Future buckets are excluded
- **GIVEN** a DETAILS dataset containing `future` buckets
- **WHEN** the DETAILS table renders
- **THEN** future buckets SHALL NOT be displayed

### Requirement: DETAILS trims pre-collection months for `total`
- Rationale: Avoid showing months before the tracker ever collected data.

#### Scenario: Total trims months before first non-zero usage
- **GIVEN** monthly DETAILS rows where the first non-zero month is `2025-10`
- **WHEN** the DETAILS table renders
- **THEN** months earlier than `2025-10` SHALL NOT be displayed

### Requirement: DETAILS preserves missing or zero buckets within collected ranges
- Rationale: Missing data should remain visible as “unsynced”, and zero usage should remain visible.

#### Scenario: Day keeps unsynced buckets
- **GIVEN** hourly DETAILS rows including `missing=true` buckets for the selected day
- **WHEN** the DETAILS table renders
- **THEN** those buckets SHALL remain visible and use the existing unsynced label
