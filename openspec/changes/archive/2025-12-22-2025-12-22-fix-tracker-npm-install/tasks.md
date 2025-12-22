# 2025-12-22-fix-tracker-npm-install 任务清单

## 1. Triage
- [x] 1.1 确认 npm registry 中 `@vibescore/tracker` 的可见性与版本（记录 `npm view` 结果）
- [x] 1.2 复核安装文案是否仍使用 `npx --yes @vibescore/tracker init`

## 2. Package publish readiness
- [x] 2.1 调整 `package.json` 允许发布：`private=false`、设置 `version`、`publishConfig.access=public`
- [x] 2.2 添加 `files` 白名单，确保发布包包含 `bin/` 与 `src/`
- [x] 2.3 增加最小 `README.md`（安装与基本使用）

## 3. Release workflow
- [x] 3.1 发布前验证：`npm pack --dry-run` 输出包含 `bin/tracker.js`
- [x] 3.2 发布首个版本到 npm（需要 `@vibescore` scope 权限）
- [x] 3.3 验证：干净环境执行 `npx --yes @vibescore/tracker --help` 成功

## 4. Regression evidence
- [x] 4.1 添加可复用的安装验证脚本或 runbook（例如 `scripts/acceptance/npm-install-smoke.cjs`）
