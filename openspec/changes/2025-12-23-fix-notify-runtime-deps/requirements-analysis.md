# Requirement Analysis

## Goal
- 确保 `notify` 触发的 `sync --auto` 不因本地 runtime 缺依赖而静默失败。

## Scope
- In scope:
  - `init` 安装本地 runtime 依赖。
  - `notify` 依赖就绪检查与回退 `npx`。
- Out of scope:
  - 解析/上传算法改动。
  - Dashboard 展示与后端接口变更。

## Users / Actors
- Codex CLI 用户。
- 本地 `notify` 触发器。

## Inputs
- `~/.codex/sessions/**/rollout-*.jsonl`
- `notify` 事件 payload（`agent-turn-complete`）

## Outputs
- `sync --auto` 能稳定启动并更新本地解析/上传状态。

## Business Rules
- `notify` 必须非阻塞、退出码 `0`。
- 自动同步节流策略不变。

## Assumptions
- 安装包目录存在 `node_modules`（npm 安装）。

## Dependencies
- `@insforge/sdk`
- Node.js `fs` / `child_process`

## Risks
- `node_modules` 复制失败导致回退 `npx`（可接受）。
- 本地依赖为符号链接时复制体积较大或失败。
