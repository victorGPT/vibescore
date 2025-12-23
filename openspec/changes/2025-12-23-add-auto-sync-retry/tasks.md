## 1. Implementation
- [x] 1.1 Update OpenSpec delta for auto retry + diagnostics
- [x] 1.2 Implement auto retry scheduling when throttled/backoff
- [x] 1.3 Surface auto retry state in diagnostics/status
- [x] 1.4 Add tests for auto retry scheduling + diagnostics
- [x] 1.5 Run minimal regression tests

## 2. Release
- [x] 2.1 Bump package version
- [x] 2.2 Run `npm pack --dry-run`
- [x] 2.3 Publish to npm (`npm publish --access public`)
- [x] 2.4 Verify `npm view @vibescore/tracker version`
