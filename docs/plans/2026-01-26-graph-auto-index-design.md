# Graph Auto-Index Design (Phase A)

## Goal
Make graph indexing automatically decide **how many indexing passes** to run (single vs multi-domain), without manual per-project tuning. The decision should be abstract enough to work across different repos.

## Scope
- Decide **index split strategy** based on repo config + structure + coverage signals.
- Generate multiple SCIP files and import them into a single SQLite database.
- Validate coverage and noise; retry with a fallback split once.

Out of scope:
- Canvas sync rules
- Query API changes

## Approach Summary
- **Config-first**: Read `tsconfig*`, workspace config, and package metadata as the primary signal.
- **Domain detection**: Identify candidate domains such as `src/`, `apps/`, `packages/`, `functions/`, `services/`.
- **Scoring and split**: Use size, coupling, and noise metrics to decide whether to split and how.
- **Sequential import**: Import each SCIP into a single SQLite to unify queries.
- **Coverage validation**: Ensure each domain is actually indexed; fallback once if not.

## Decision Logic
1) **Discover domains**
- Parse `tsconfig*` include/exclude.
- Detect common domain roots: `src/`, `apps/`, `packages/`, `functions/`, `services/`, `workers/`.

2) **Score domains**
- **Size**: file count / symbol count.
- **Coupling**: cross-domain import ratio (approx via imports table or heuristics).
- **Noise**: non-runtime paths (fixtures, build, dist, generated).

3) **Split rules**
- Split if size exceeds threshold **and** coupling is below threshold.
- Force split for domains with high noise or different runtime (e.g., edge functions).

4) **Fallback**
- If coverage validation fails, retry once with a more fine-grained split.

## Components
- **Config Reader**: loads project config and normalizes includes.
- **Domain Analyzer**: builds candidate domains and computes metrics.
- **Indexer Orchestrator**: generates `index.<domain>.scip`, imports into SQLite.
- **Verifier**: coverage check + noise check; triggers fallback if needed.

## Data Flow
1) Read config → candidate domains
2) Score → decide split plan
3) Generate `index.<domain>.scip`
4) Import into `graph.sqlite` (append)
5) Validate coverage
6) Emit `graph.plan.json`

## Error Handling
- Config read fail → fall back to directory inference only.
- Import failure → stop, report diagnostics.
- Validation failure → retry once with fallback split, then stop.

## Verification Criteria
- `graph.sqlite` resolves symbols from each domain.
- Coverage checks: `file_path LIKE '<domain>/%'` returns > 0 symbols.
- Noise checks: non-target paths < threshold (default 15%).
- `graph.plan.json` created with metrics and chosen plan.

## Example Plan Output
```json
{
  "domains": ["core", "edge"],
  "core": {"paths": ["src", "bin", "scripts"], "symbols": 8200},
  "edge": {"paths": ["insforge-src", "insforge-functions"], "symbols": 2100},
  "decision": "split",
  "fallback": "none"
}
```

## Notes
- Importer must support append; if not, merge SCIP before import.
- Metrics collection should remain cheap and fast.
