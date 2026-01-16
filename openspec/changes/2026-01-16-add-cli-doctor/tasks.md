## 1. Implementation
- [ ] 1.1 Add `resolveRuntimeConfig` and remove `VIBESCORE_*` env usage
- [ ] 1.2 Add `doctor` command + lib checks (read-only, JSON schema)
- [ ] 1.3 Update CLI help and docs (README/README.zh-CN/project spec)
- [ ] 1.4 Update architecture canvas statuses

## 2. Tests
- [ ] 2.1 Add `test/doctor.test.js`
- [ ] 2.2 Add `test/runtime-config.test.js`
- [ ] 2.3 Update `test/cli-help.test.js`

## 3. Verification
- [ ] 3.1 Run `node --test test/doctor.test.js test/runtime-config.test.js test/cli-help.test.js test/diagnostics.test.js`
