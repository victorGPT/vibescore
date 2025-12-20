## Context
The dashboard includes a Neural_Flux_Monitor sparkline panel, but it lacks axis labels and does not explicitly align with the period selection used by Zion_Index. Users interpret it as a moving effect rather than a comparable metric.

## Goals / Non-Goals
- Goals:
  - Add X/Y axes and tick labels to make the metric legible.
  - Keep the flux monitor aligned with the Zion_Index period/range selection.
  - Keep the UI minimal and consistent with the Matrix UI A theme.
- Non-Goals:
  - Add new backend endpoints or change data aggregation.
  - Introduce heavy charting libraries.

## Decisions
- Use existing daily usage data (already used by Zion_Index) to feed the flux monitor.
- X-axis reflects the current period range (UTC), e.g. day/week/month/total.
- Y-axis shows token count scale derived from current data (min=0, max=tick max).
- Keep axes styling subtle to avoid clutter (small font, low opacity).
- Show minimal axes/range labels even when data is empty to preserve context.
- Rename the panel label to `Trend` (industry-standard trend naming).

## Alternatives Considered
- Keep current minimalist view: rejected because readability is poor.
- Add a full charting library: rejected due to unnecessary complexity.

## Risks / Trade-offs
- Adding axes may reduce the “retro” feel if too prominent → mitigate via subtle styling.
- For sparse data, axis ticks might look empty → mitigate by showing baseline ticks only.

## Migration Plan
- Pure UI change. No data migration needed.

## Open Questions
- None.
