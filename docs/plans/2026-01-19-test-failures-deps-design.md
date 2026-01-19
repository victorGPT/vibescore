# Fix Test Failures Caused By Missing Dev Dependencies - Design

## Section 1: Context and Goal

The current test failures come from runtime module resolution errors rather than logic regressions. `scripts/build-insforge-functions.cjs` requires `esbuild`, and `dashboard/src/lib/insforge-client.js` imports `@insforge/sdk`. Both are declared in `package.json` but were not installed in the local test environment. This causes tests that spawn the build script or dynamically import the dashboard API layer to fail before assertions can run. The goal is to restore a reliable local test environment that matches CI expectations, so the existing tests can execute and validate functional behavior without modifying production code paths.

The desired outcome is: (1) dependency resolution succeeds, (2) the build script test can execute and remove stale artifacts, and (3) dashboard function-path tests can exercise `/functions` vs `/api/functions` fallback logic as written. We should not introduce compatibility shims or bypass dependency loading in production modules. Instead, we should make the local environment consistent with declared dependencies and record the regression results in OpenSpec tasks for traceability.

## Section 2: Approach and Trade-offs

Option A (recommended): install declared dependencies with `npm install` and re-run the failing tests. This keeps production code untouched, aligns local runs with CI, and avoids adding runtime fallbacks or test-only mocks. It is the minimal-diff path and preserves existing contracts. The only downside is a local environment change (node_modules), but that is expected for Node projects and does not affect the repo history.

Option B: add conditional requires or stubs in scripts and dashboard code to avoid loading dependencies during tests. This would change runtime behavior, introduce compatibility logic (disallowed by policy), and risk hiding real integration issues. It also expands the blast radius into production code.

Option C: rewrite the tests to mock dependency loading. This would weaken the tests, reduce confidence, and still deviate from the expected runtime behavior.

We will follow Option A and then verify by running the previously failing tests and the full test suite. Results will be recorded in `openspec/changes/2026-01-19-update-dashboard-session-renewal/tasks.md`.
