# Graph SCIP Generation

Run:

```bash
npm run graph:scip
```

Output: `index.scip` at repo root.

This script uses `tsconfig.json` (which extends `tsconfig.scip.json`) for indexing. If you need to add more paths, update `tsconfig.scip.json`.

## Graph Auto-Index

Run a dry-run plan:

```bash
npm run graph:auto-index
```

Apply indexing + import (multi-domain when needed):

```bash
npm run graph:auto-index -- --apply
```

Output: `graph.plan.json` at repo root, plus `index.<domain>.scip` files when applied.

## SQLite Query Templates

See `docs/graph/sql-templates.md` for fixed SQL templates that avoid hand-written queries.
