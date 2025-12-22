# 2025-12-22-release-tracker-0-0-3 任务清单

## 1. Release preparation
- [ ] 1.1 更新版本号到 `0.0.3`（`package.json` + `package-lock.json`）
- [ ] 1.2 运行 `npm pack --dry-run` 确认发布内容

## 2. Publish
- [ ] 2.1 执行 `npm publish --access public`（需要 `@vibescore` 权限与 2FA）

## 3. Verification
- [ ] 3.1 `npm view @vibescore/tracker version` 输出 `0.0.3`
- [ ] 3.2 `npx --yes @vibescore/tracker --help` 可用
- [ ] 3.3 `VIBESCORE_DEBUG=1 npx --yes @vibescore/tracker sync` 输出包含 `Status`/`Code`
