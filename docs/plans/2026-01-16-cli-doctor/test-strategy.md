# Test Strategy

## Objectives
- 验证 `doctor` 输出、`--out` 行为、JSON schema、退出码与关键检查判定。
- 验证 `resolveRuntimeConfig` 仅接受 `VIBEUSAGE_*`，CLI flags 优先级最高并覆盖全部字段。

## Test Levels
- Unit:
  - `doctor` JSON schema / checks / exit code
  - `resolveRuntimeConfig` 解析优先级
  - 网络探测（mock fetch + timeout）
- Integration:
  - CLI `doctor` 命令路径与 help 输出
- Regression:
  - `diagnostics` 原有 JSON 输出保持不变
- Performance:
  - N/A（诊断命令为轻量读操作）

## Test Matrix
- Requirement: doctor output -> Unit + Integration -> CLI owner -> `test/doctor.test.js`
- Requirement: doctor --out -> Unit + Integration -> CLI owner -> `test/doctor.test.js`
- Requirement: runtime config single-source -> Unit -> CLI owner -> `test/runtime-config.test.js`
- Requirement: read-only diagnostics -> Unit -> CLI owner -> `test/doctor.test.js`
- Requirement: network reachability semantics -> Unit -> CLI owner -> `test/doctor.test.js`
- Requirement: exit codes -> Unit -> CLI owner -> `test/doctor.test.js`

## Environments
- Node.js >= 18
- Local filesystem with temp dirs

## Automation Plan
- 使用 `node --test` 执行新测试
- 必要时注入 `fetch` stub 和临时 HOME

## Entry / Exit Criteria
- Entry:
  - 需求与验收标准已确认
  - OpenSpec proposal 已创建
- Exit:
  - 新增测试通过
  - 旧测试不回归
  - 验证步骤记录在 verification report

## Coverage Risks
- 网络请求受环境影响（通过 stub 降低）
