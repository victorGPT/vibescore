## ADDED Requirements

### Requirement: Dashboard uses Geist Mono as the primary UI font
The dashboard UI SHALL use `Geist Mono` as the primary font across Matrix UI A components, with monospace fallbacks.

#### Scenario: Dashboard renders with Geist Mono
- **WHEN** a user opens the dashboard
- **THEN** the UI text SHALL render with `Geist Mono` as the first font-family choice

### Requirement: Dashboard typography scale is standardized
The dashboard UI SHALL standardize typography with four scales: display (core index), heading (module titles), body (primary data), and caption (labels/metadata).

#### Scenario: Core index uses display scale
- **WHEN** the dashboard renders the core index value
- **THEN** the value SHALL use the display scale (48-72px, extra-bold) with a glow emphasis

#### Scenario: Module titles use heading scale
- **WHEN** a module title (e.g., Identity/Core, Install, Activity Grid) is rendered
- **THEN** the title SHALL use the heading scale (14-16px), uppercase, and letter spacing

#### Scenario: Labels use caption scale
- **WHEN** labels or metadata (e.g., TOTAL TOKENS, axes, table headers) are rendered
- **THEN** they SHALL use the caption scale (12px, regular/light) with reduced opacity

### Requirement: Panels use smoked-glass styling
The dashboard UI SHALL render Matrix UI A panels with a dark translucent background, backdrop blur, and thin green-toned borders.

#### Scenario: Panel background uses smoked glass
- **WHEN** a Matrix UI A panel is rendered
- **THEN** the background SHALL use a dark translucent green/black
- **AND** the panel SHALL apply backdrop blur to the underlying matrix rain
- **AND** the border SHALL be thin and low-contrast

### Requirement: Color hierarchy is explicit
The dashboard UI SHALL reserve high-brightness green for primary data and active states, while using muted green/gray-green tones for secondary labels.

#### Scenario: Primary data is visually dominant
- **WHEN** primary metrics or active states are rendered
- **THEN** they SHALL use the primary highlight color

#### Scenario: Labels are visually subordinate
- **WHEN** labels or secondary metadata are rendered
- **THEN** they SHALL use muted tones and lower opacity

### Requirement: Mock "now" override supports Monday-week validation
When mock mode is enabled, the dashboard SHALL allow overriding the notion of "now" for visual verification of week-start behavior.

#### Scenario: Mock now drives week range and future markers
- **GIVEN** mock mode is enabled and a mock date is supplied via `VITE_VIBESCORE_MOCK_NOW` or `mock_now`
- **WHEN** the dashboard renders week-based views
- **THEN** the computed ranges and future markers SHALL reflect the supplied mock date
