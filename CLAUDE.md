# Project Guidelines for Claude Code

## OpenSpec Workflow

This project uses **OpenSpec** for spec-driven development. Before making significant changes:

1. Read `openspec/project.md` for project conventions
2. Check `openspec/AGENTS.md` for the full OpenSpec workflow
3. Run `openspec list` to see active changes
4. Run `openspec list --specs` to see existing specifications

### When to Create a Proposal

Create a proposal (`openspec/changes/<id>/`) for:

- New features or capabilities
- Breaking changes (API, schema)
- Architecture or pattern changes
- Security-related changes

Skip proposals for:

- Bug fixes (restore intended behavior)
- Typos, formatting, comments
- Dependency updates (non-breaking)

### OpenSpec Commands

```bash
openspec list                     # List active changes
openspec list --specs             # List specifications
openspec show <item>              # View change or spec details
openspec validate <id> --strict   # Validate a change proposal
openspec archive <id> --yes       # Archive after deployment
```

### Proposal Structure

```
openspec/changes/<change-id>/
├── proposal.md     # Why and what
├── tasks.md        # Implementation checklist
├── design.md       # Technical decisions (optional)
└── specs/
    └── <capability>/
        └── spec.md # ADDED/MODIFIED/REMOVED requirements
```

## Project Structure

- `src/` - CLI source code (Node.js, CommonJS)
- `bin/` - CLI entry points
- `dashboard/` - React dashboard (Vite)
- `insforge-src/` - Backend Edge Functions source
- `insforge-functions/` - Built backend functions (generated)
- `openspec/` - Specifications and change proposals

## Key Commands

```bash
npm test                          # Run tests
npm run build:insforge            # Build backend functions
npm run dashboard:dev             # Start dashboard dev server
npm run validate:copy             # Validate copy registry
```

## Conventions

- Platform: macOS-first
- All user-facing text managed in `dashboard/src/content/copy.csv`
- Token data only - never store or upload conversation content
- Use UTC for all timestamps
- Half-hour buckets for aggregation
