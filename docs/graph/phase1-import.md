# Graph Phase 1 Import Runbook

1) Download the `scip-index` artifact from CI.
2) Run the importer (external repo `tools/graph`):

```bash
node tools/graph/build/importer.js \
  --scip ./index.scip \
  --db ./data/graph.sqlite
```

3) Verify queries using the graph query API (Definitions/References).
