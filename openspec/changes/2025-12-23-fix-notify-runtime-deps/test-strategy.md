# Test Strategy

## Objectives
- 验证本地 runtime 安装依赖后 `sync --auto` 可启动。
- 依赖缺失时 `notify` 能回退 `npx`。

## Test Levels
- Unit: 依赖就绪判断逻辑（通过文件存在性）。
- Integration: `init` → `notify` → `sync --auto` 链路。
- Regression: 新增回归脚本验证本地 runtime 依赖安装。
- Performance: N/A

## Test Matrix
- Local runtime deps installed -> Regression -> scripts/acceptance/notify-local-runtime-deps.cjs -> CLI
- Notify fallback -> Integration -> manual runbook -> CLI

## Environments
- macOS 本地开发环境

## Automation Plan
- 新增 `scripts/acceptance/notify-local-runtime-deps.cjs` 并记录执行结果。

## Entry / Exit Criteria
- Entry: 提案与任务确认。
- Exit: 回归脚本通过，手动链路验证通过。

## Coverage Risks
- fallback 行为依赖 `npx` 网络可用性；必要时用本地 runtime 验证。
