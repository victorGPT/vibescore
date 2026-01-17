## 1. Planning
- [x] Confirm requirements and acceptance criteria with user
- [x] Confirm proposal approval before implementation

## 2. Tests (TDD)
- [x] Add regression test for CORE_INDEX collapse toggle and copy keys
- [ ] Verify test fails before implementation

## 3. Implementation
- [x] Add collapse toggle and breakdown-only collapsed rendering to `UsagePanel`
- [x] Add CORE_INDEX breakdown collapsed state (default collapsed) in `DashboardPage`
- [x] Add copy registry keys for toggle icon and aria labels

## 4. Verification
- [x] Run `node --test test/dashboard-core-index-collapse.test.js`
- [x] Run `node scripts/validate-copy-registry.cjs`

## 5. Docs & Spec
- [x] Update spec delta under `openspec/changes/2025-12-28-collapse-core-index-panel/specs/vibeusage-tracker/spec.md`
- [ ] Record verification notes (if applicable)
