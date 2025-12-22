# Change: Fix public npm install for @vibescore/tracker

## 结论
当前用户通过 `npx --yes @vibescore/tracker init` 报 `E404`，根因是包未对 npm 公共仓库发布（`package.json` 标记为 `private` 且缺少发布流程）。本次变更确保 CLI 包在 npm 公共仓库可获取，恢复 `npx` 安装与运行路径。

## Why
- 终端报错 `E404 Not Found`，用户无法安装，已阻断核心流程。
- 规格要求提供 `@vibescore/tracker` CLI；目前未发布导致需求不满足。

## What Changes
- 明确 `@vibescore/tracker` 在 npm 公共仓库的发布与版本管理流程。
- 补齐 package metadata（允许发布、设置版本、`publishConfig.access=public`、`files` 白名单）。
- 增加可重复的发布前验收与安装验证（`npm pack` + `npx --yes @vibescore/tracker --help`）。

## Impact
- Affected specs: `vibescore-tracker`
- Affected code: `package.json`, `bin/`, `src/`, `scripts/`
- 风险：发布权限与令牌管理；需要发布者具备 `@vibescore` scope 权限
