# Graph Auto-Index (Phase A)

## Goal
Automate graph indexing split decisions and run multi-domain SCIP generation, import, and validation with a single fallback.

## Scope
- Auto-index planner (config, domain discovery, metrics, split decision)
- Multi-domain SCIP generation
- Import into SQLite via internal importer
- Coverage/noise validation with one fallback

## Out of Scope
- Query API changes
- Canvas sync rules beyond this change

## Implementation Notes
- CLI: `npm run graph:auto-index` (dry-run) and `--apply` to execute.
- Output: `graph.plan.json` + `index.<domain>.scip` files.
- Importer: `scripts/graph/lib/importer.cjs` (internal).
