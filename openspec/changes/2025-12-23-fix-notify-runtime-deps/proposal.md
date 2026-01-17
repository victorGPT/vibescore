# Change: Fix notify local runtime dependencies for auto sync

## 结论
当前 `notify` 触发的本地 runtime 缺少 `@insforge/sdk` 导致 `sync --auto` 静默失败，自动同步失效。需要在 `init` 安装本地 runtime 时补齐运行时依赖，并在 `notify` 侧做依赖就绪检查，缺失则回退 `npx`。

## Why
- 本地 runtime 缺依赖会抛 `MODULE_NOT_FOUND`，导致自动同步不运行。
- 用户表现为「持续使用但页面不更新」，影响可信度。

## What Changes
- `init` 安装本地 runtime 时复制 `node_modules`，保证运行时依赖可用。
- `notify` 触发时检查依赖标记，缺失则回退 `npx --yes @vibescore/tracker sync --auto`。

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `src/commands/init.js`，生成的 `~/.vibescore/bin/notify.cjs`
- **BREAKING**: none

## Architecture / Flow
- `notify` 落盘信号 → 节流 → 若本地 runtime + 依赖可用则用本地 `node` 执行，否则回退 `npx`。

## Risks & Mitigations
- `init` 变慢或占用磁盘：复制依赖为 best-effort，失败则回退 `npx`。
- 依赖目录为符号链接：允许复制失败并回退 `npx`。

## Rollout / Milestones
- 按 M1~M5 里程碑执行（需求/提案 → 实现 → 回归验证）。
