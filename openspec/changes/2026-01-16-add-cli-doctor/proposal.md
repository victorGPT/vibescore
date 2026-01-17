# Change: Add CLI Doctor Mode

## Why
- CLI 缺少可复现的自诊断入口，排障依赖人工推断。
- 运行时配置解析分散，存在事实来源不一致与兼容噪音。

## What Changes
- 新增 `doctor` 命令，提供人类可读报告与 JSON 输出。
- 统一运行时配置解析（`resolveRuntimeConfig`）。
- **BREAKING**：移除 `VIBESCORE_*` 兼容环境变量（`VIBESCORE_INSFORGE_BASE_URL`、`VIBESCORE_DEVICE_TOKEN`、`VIBESCORE_DASHBOARD_URL`、`VIBESCORE_HTTP_TIMEOUT_MS`、`VIBESCORE_DEBUG`、`VIBESCORE_INSFORGE_ANON_KEY`、`VIBESCORE_AUTO_RETRY_NO_SPAWN`）。
- **BREAKING**：仅接受 `VIBEUSAGE_*` 作为环境变量来源（忽略 `INSFORGE_ANON_KEY`）。

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code: `src/cli.js`, `src/commands/doctor.js`, `src/lib/doctor.js`, `src/lib/runtime-config.js`, `src/commands/init.js`, `src/commands/sync.js`, tests, docs
- **BREAKING**: `VIBESCORE_*` env 不再生效

## Architecture / Flow
- `doctor` 读取 diagnostics 快照 + runtime config
- 仅做只读检查，输出 summary + checks

## Risks & Mitigations
- 破坏性变更影响旧用户：文档明确 + release notes 提示
- 网络探测超时：使用已有超时控制并捕获异常

## Rollout / Milestones
- 完成 OpenSpec proposal + tests
- 验证 `doctor` 与 `diagnostics` 不冲突
