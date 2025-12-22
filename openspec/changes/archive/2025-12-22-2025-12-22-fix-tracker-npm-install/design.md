# Module Brief: Public npm distribution for @vibescore/tracker

## Scope
- IN: 公开发布 `@vibescore/tracker` 到 npm registry；补齐发布所需的 package metadata；定义发布前后验证流程。
- OUT: CLI 行为变更、后端 API/鉴权变更、Dashboard 交互变更。

## Interfaces
- npm registry: `registry.npmjs.org`（scope: `@vibescore`）
- 安装入口：`npx --yes @vibescore/tracker <command>`
- 发布入口：`npm publish`（需要 `NPM_TOKEN` 或交互登录）

## Data flow and constraints
- `npx` 从 npm registry 拉取包 → 执行 `bin/tracker.js`。
- 包必须是 public（`publishConfig.access=public`），且 `package.json` 不能是 `private`。
- 发布凭据不得写入仓库；使用环境变量或本地登录态。

## Non-negotiables
- `npx --yes @vibescore/tracker --help` 在未登录 npm 的环境下可成功运行（无 `404/403`）。
- 发布包不得包含敏感文件或本地配置（通过 `files` 白名单控制）。

## Test strategy
- `npm pack --dry-run` 确认发布内容（包含 `bin/` 与 `src/`）。
- 干净环境执行 `npx --yes @vibescore/tracker --help`。
- 记录安装验证脚本或 runbook 作为回归证据。

## Milestones
1. Package metadata 完整且 `npm pack --dry-run` 通过。
2. npm public 发布成功并验证 `npx` 安装。
3. 回归验证脚本/文档就绪。

## Plan B triggers
- 若 npm publish 因 scope 权限或政策失败，则切换到备用分发（例如 GitHub tarball），并同步更新文案与规格。

## Upgrade plan (disabled by default)
- 默认不启用备用分发；仅在 Plan B 触发时执行。
