## ADDED Requirements
### Requirement: Pricing profiles can be synced from OpenRouter
The system SHALL provide a protected sync endpoint that fetches OpenRouter Models API pricing and upserts it into `vibescore_pricing_profiles` with `source = "openrouter"`.

#### Scenario: Sync endpoint upserts pricing rows
- **WHEN** an authorized caller invokes the pricing sync endpoint
- **THEN** the system SHALL upsert pricing rows keyed by `(model, source, effective_from)`
- **AND** the response SHALL report counts of processed and upserted rows

### Requirement: Pricing resolver selects a configured default model/source
When multiple pricing profiles exist, the system MUST select a configured default model/source for cost calculation unless explicitly overridden.

#### Scenario: Resolver uses configured model/source
- **GIVEN** multiple active pricing profiles exist
- **WHEN** the resolver runs without explicit overrides
- **THEN** it SHALL select the profile matching the configured default model/source

### Requirement: Pricing history is preserved by default
The system MUST NOT delete historical pricing rows unless explicit retention parameters are provided.

#### Scenario: Retention disabled keeps history
- **GIVEN** sync runs without a retention parameter
- **WHEN** the sync completes
- **THEN** historical rows SHALL remain unchanged
