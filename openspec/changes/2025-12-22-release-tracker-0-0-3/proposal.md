# Change: Release @vibescore/tracker v0.0.3

## Why
- 当前 CLI 已增强错误可观测性，但尚未发布到 npm，用户无法获得修复。
- 需要明确一次版本发布与验证流程，避免回归和“覆盖旧版本”错误。

## What Changes
- 将 CLI 版本提升至 `0.0.3` 并发布到 npm 公共仓库。
- 发布前执行最小验证（`npm pack --dry-run`）。
- 发布后验证 `npx --yes @vibescore/tracker --help` 与 `sync` 的 debug 输出。

## Impact
- Affected specs: `vibescore-tracker`
- Affected code: `package.json`, `package-lock.json`
- 风险：发布权限与 2FA 流程；需要具备 `@vibescore` scope 权限
