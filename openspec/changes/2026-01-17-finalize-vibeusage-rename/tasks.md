## 1. OpenSpec change scaffolding + validation
- [x] 1.1 Add proposal, acceptance criteria, test strategy, module brief, and spec delta
- [x] 1.2 Run `openspec validate 2026-01-17-finalize-vibeusage-rename --strict`
- [x] 1.3 Commit OpenSpec scaffolding

## 2. Rename stable spec directory and references
- [x] 2.1 Rename `openspec/specs/vibescore-tracker` to `openspec/specs/vibeusage-tracker`
- [x] 2.2 Update references in `openspec/changes/**`, `docs/**`, and `openspec/project.md`
- [x] 2.3 Run `openspec validate 2026-01-17-finalize-vibeusage-rename --strict`
- [x] 2.4 Commit spec rename

## 3. Add runtime guard against `vibescore` references
- [x] 3.1 Add `test/no-vibescore-runtime.test.js`
- [ ] 3.2 Run `node --test test/no-vibescore-runtime.test.js` (expect fail then pass)
- [ ] 3.3 Commit runtime guard

## 4. CLI + local runtime rename to vibeusage endpoints
- [ ] 4.1 Rename CLI API module and update imports
- [ ] 4.2 Remove legacy bin alias
- [ ] 4.3 Update CLI tests and run focused tests
- [ ] 4.4 Commit CLI rename

## 5. Remove VIBESCORE env fallbacks (CLI + dashboard + shared)
- [ ] 5.1 Update shared env readers and dashboard config
- [ ] 5.2 Update tests and run focused tests
- [ ] 5.3 Commit env cleanup

## 6. Rename edge functions to vibeusage
- [ ] 6.1 Rename edge function files and remove wrappers
- [ ] 6.2 Run `node --test test/edge-functions.test.js`
- [ ] 6.3 Commit edge function rename

## 7. Rename database objects (migration + rollback)
- [ ] 7.1 Add rename and rollback SQL scripts
- [ ] 7.2 Update code references to `vibeusage_*`
- [ ] 7.3 Commit DB rename assets

## 8. Dashboard API + storage rename
- [ ] 8.1 Rename dashboard API module and update imports
- [ ] 8.2 Update storage keys and tests
- [ ] 8.3 Run dashboard tests
- [ ] 8.4 Commit dashboard rename

## 9. Docs + scripts + smoke updates
- [ ] 9.1 Update docs and scripts for `vibeusage` naming
- [ ] 9.2 Commit docs/scripts updates

## 10. Verification + build + canvas sync
- [ ] 10.1 Run full tests and insforge build checks
- [ ] 10.2 Run runtime guard
- [ ] 10.3 Update `architecture.canvas`
- [ ] 10.4 Run `openspec validate 2026-01-17-finalize-vibeusage-rename --strict`
- [ ] 10.5 Commit build + canvas sync

## 11. Deployment (MCP only)
- [ ] 11.1 Deploy updated edge functions
- [ ] 11.2 Record verification report
- [ ] 11.3 Commit verification report

## 12. Post-implementation cleanup
- [ ] 12.1 Run `openspec validate --strict`
- [ ] 12.2 Confirm no `vibescore` runtime references remain
- [ ] 12.3 Ensure working tree clean
