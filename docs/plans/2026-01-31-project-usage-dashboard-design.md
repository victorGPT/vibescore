# Project Usage Dashboard Cards Design

## Summary
Add a project usage summary edge function and a dashboard panel that renders GitHub-style repository cards (avatar, owner, repo name, stars, token usage). Default to top 3 entries with a dropdown for top 6 and top 10. Token values render compact (K/M/B) with full value on hover.

## Goals
- Provide a fast visual view of token usage per GitHub repository.
- Keep UI consistent with the Matrix dashboard aesthetic while mirroring GitHub card structure.
- Preserve privacy: only public GitHub repos are shown (per existing CLI rules).

## Non-Goals
- No private repo support.
- No advanced filters or search.
- No project-level time series or breakdown charts.

## Data Flow
1. Dashboard requests `/functions/vibeusage-project-usage-summary` with `limit`.
2. Edge function aggregates `vibeusage_project_usage_hourly` by project.
3. UI renders cards; GitHub metadata is fetched client-side for stars and avatar.

## API Contract
`GET /functions/vibeusage-project-usage-summary?limit=3&from=YYYY-MM-DD&to=YYYY-MM-DD`

Response:
```
{
  "from": "YYYY-MM-DD",
  "to": "YYYY-MM-DD",
  "generated_at": "ISO",
  "entries": [
    {
      "project_key": "owner/repo",
      "project_ref": "https://github.com/owner/repo",
      "total_tokens": "123",
      "billable_total_tokens": "123"
    }
  ]
}
```

## UI Structure
- `ProjectUsagePanel` (AsciiBox wrapper)
- Card list with owner avatar, owner name, repo name, star count, token count
- Dropdown for limit selection (3/6/10)

## Edge Cases
- GitHub API failures: show placeholder avatar and `---` stars.
- Missing token values: show placeholder.
- Screenshot mode: skip GitHub fetch calls.

## Testing
- Edge function test for auth + aggregation query parameters.
- Dashboard API path test to ensure `/functions` routing.
- Copy registry validation + UI hardcode checks.
