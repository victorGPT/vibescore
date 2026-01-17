## 1. Implementation
- [x] 1.1 Add `resolveRuntimeConfig` and remove all non-`VIBEUSAGE_*` env usage (VIBESCORE + INSFORGE_ANON_KEY)
- [x] 1.2 Add `doctor` command + lib checks (read-only, JSON schema)
- [x] 1.3 Ensure diagnostics supports no-migrate mode for doctor
- [x] 1.4 Update CLI help and docs (README/README.zh-CN/openspec project spec)
- [x] 1.5 Update architecture canvas statuses

## 2. Tests
- [x] 2.1 Add `test/doctor.test.js`
- [x] 2.2 Add `test/runtime-config.test.js`
- [x] 2.3 Update `test/cli-help.test.js`

## 3. Verification
- [x] 3.1 Run `node --test test/doctor.test.js test/status.test.js test/diagnostics.test.js test/cli-help.test.js test/auto-retry.test.js test/init-uninstall.test.js`
