## ADDED Requirements

### Requirement: Public View profile identity fields
The system SHALL return privacy-safe `display_name` and `avatar_url` for a valid share token via the Public View profile endpoint.

#### Scenario: Valid share token returns avatar
- **WHEN** a request to `GET /functions/vibeusage-public-view-profile` includes a valid share token
- **THEN** the response SHALL include `display_name` and `avatar_url`
- **AND** `avatar_url` SHALL be `null` unless it is a valid http/https URL within length limits

#### Scenario: Invalid share token
- **WHEN** a share token is invalid or revoked
- **THEN** the endpoint SHALL return an authorization error

## MODIFIED Requirements

### Requirement: Public View does not expose private identifiers
Public View MAY expose `display_name` and `avatar_url` derived from user metadata, but MUST NOT expose email addresses, `user_id`, or raw metadata.

#### Scenario: Identity fields are sanitized
- **WHEN** Public View renders identity or profile data
- **THEN** any `display_name` containing an email address SHALL be replaced by the anonymous fallback
- **AND** any `avatar_url` that is non-http/https, empty, or exceeds `1024` characters SHALL be returned as `null`
