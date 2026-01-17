# Requirement Analysis

## Goal
- 为 CLI 新增 `doctor` 模式，提供“可读诊断 + JSON 输出”的统一健康检查，并将运行时配置解析收敛为单一事实来源。

## Scope
- In scope:
  - 新增 `doctor` 命令与检查项（runtime/config/fs/cli/network/notify/upload）。
  - 新增 `resolveRuntimeConfig` 统一解析配置来源（config/env/default）。
  - 移除 `VIBESCORE_*` 兼容环境变量。
  - 更新 CLI 帮助与文档说明。
- Out of scope:
  - 后端接口/数据库变更。
  - Dashboard 功能或 UI 改动。
  - 自动修复或写入业务数据。

## Users / Actors
- CLI 终端用户
- 支持/排障人员

## Inputs
- CLI 参数：`doctor`, `--json`, `--out`
- 本地文件：`~/.vibeusage/tracker/**`
- 环境变量：`VIBEUSAGE_*`
- 网络连接（`base_url`）

## Outputs
- 人类可读诊断报告（stdout）
- JSON 报告（stdout 或 `--out`）
- 退出码（critical 才非 0）

## Business Rules
- 不保留任何 `VIBESCORE_*` 兼容入口。
- `doctor` 只读，不触发迁移、不写业务数据。
- 网络可达性：任何 HTTP 响应视为“可达”。
- 仅 critical 失败返回非 0 退出码。
- `--out` 等价于 `--json`，只输出/写入 JSON。
- 运行时配置优先级：`CLI flags` > `config.json` > `VIBEUSAGE_*` > 默认值。
- 仅接受 `VIBEUSAGE_*` 作为环境变量来源（忽略 `INSFORGE_ANON_KEY`）。
- 运行时配置字段（canonical camelCase）：`baseUrl`、`deviceToken`、`dashboardUrl`、`httpTimeoutMs`、`debug`、`insforgeAnonKey`、`autoRetryNoSpawn`。

## Assumptions
- Node.js >= 18，`fetch` 可用。
- `collectTrackerDiagnostics` 已负责脱敏。
- 默认 `base_url` 保持现有值。

## Dependencies
- `src/lib/diagnostics.js`
- `src/lib/tracker-paths.js`
- `src/lib/cli-ui.js`
- `src/lib/fs.js`

## Risks
- 兼容环境变量移除带来破坏性变更。
- 权限/IO 错误导致 doctor 无法执行。
- 网络不可达时诊断输出需可读且不误判。
