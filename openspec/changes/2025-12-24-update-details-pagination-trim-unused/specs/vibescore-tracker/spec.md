## ADDED Requirements

### Requirement: Dashboard DETAILS paginates day and total
The dashboard UI SHALL paginate the DETAILS table for `day` and `total` periods with a page size of 12 rows.

#### Scenario: Day details pagination
- **GIVEN** the user selects `day` and the DETAILS dataset has more than 12 hourly buckets
- **WHEN** the DETAILS table renders
- **THEN** it SHALL show 12 rows per page and render prev/next controls

#### Scenario: Total details pagination
- **GIVEN** the user selects `total` and the DETAILS dataset has more than 12 monthly buckets
- **WHEN** the DETAILS table renders
- **THEN** it SHALL show 12 rows per page and render prev/next controls

### Requirement: Dashboard DETAILS hides future buckets and trims months before first non-zero usage for total
The dashboard UI SHALL NOT display future buckets and SHALL trim leading months before the first non-zero usage month in DETAILS for the `total` period.

#### Scenario: Total trims months before first non-zero usage
- **GIVEN** monthly DETAILS rows where the first non-zero month is `2025-10`
- **WHEN** the DETAILS table renders
- **THEN** months earlier than `2025-10` SHALL NOT be displayed

#### Scenario: Day keeps missing buckets
- **GIVEN** hourly DETAILS rows with `missing=true` buckets on the selected day
- **WHEN** the DETAILS table renders
- **THEN** those buckets SHALL remain visible with the existing unsynced label
