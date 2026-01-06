# TDD Workflow

## Purpose
- Keep behavior changes test-driven and verifiable.
- Reduce architectural blind spots before writing tests or code.

## Progressive Disclosure (Architecture Canvas)
Use the focused canvas to avoid loading the full graph.

1) List modules
   - `node scripts/ops/architecture-canvas.cjs --list-modules`
2) Focus the target module
   - `node scripts/ops/architecture-canvas.cjs --focus <module> --out architecture.focus.canvas`
3) Read the focused canvas
   - Only open `architecture.focus.canvas`. Open `architecture.canvas` only when explicitly required.

## Granularity Guidelines
- Small changes (single function or localized edits):
  - Focus the primary module only.
- Medium changes (multiple files within a module):
  - Focus the module, then re-focus adjacent modules as needed.
- Large changes (cross-module data flow or interfaces):
  - Expand focus step-by-step along the flow.
  - Open the full canvas only when dependencies remain unclear.

## TDD Cycle
- RED: write a failing test for one behavior.
- GREEN: implement the minimal change to pass.
- REFACTOR: clean up without changing behavior.

## Regression Gate
- Run a targeted regression test for the change.
- Record the command and result in `docs/pr/`.
