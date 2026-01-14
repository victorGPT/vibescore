# PR Template (Minimal)

## PR Goal (one sentence)
Add Codex Context and Public Exposure checklist to the GitHub PR template.

## Commit Narrative
- docs: add Codex context PR template

## Regression Test Gate
### Most likely regression surface
- GitHub PR template rendering and required sections for Codex review context.

### Verification method (choose at least one)
- [x] `rg -n "Codex Context|Public Exposure Checklist" .github/PULL_REQUEST_TEMPLATE.md` => PASS

### Uncovered scope
- GitHub UI rendering of the template (manual).
