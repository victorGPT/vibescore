# Test Strategy

## Objectives
- 验证 link code 签发与兑换流程的正确性与安全边界。
- 验证 CLI `init --link-code` 的成功路径与失败回退。
- 验证 Dashboard 安装命令遮罩与复制行为。

## Test Levels
- Unit:
  - CLI 参数解析与 link code 处理逻辑。
  - 兑换逻辑（hash/TTL/已使用校验）。
  - 安装命令拼接与遮罩函数。
- Integration:
  - Edge Function 数据库写入（link code 与 device token）。
- Regression:
  - 现有 `init`/`uninstall` 行为不回归。
  - copy registry 校验通过。
- Performance:
  - 不新增性能测试（无新热点路径）。

## Test Matrix
- Link code issue -> Integration -> `test/edge-functions.test.js` -> 新增用例
- Link code exchange -> Integration -> `test/edge-functions.test.js` -> 新增用例
- CLI `--link-code` success/fallback -> Unit -> `test/init-uninstall.test.js` 或新增测试文件
- Masked display + copy button -> Unit/Manual -> `dashboard` 组件测试（若无框架则手动）
- copy registry -> Regression -> `node scripts/validate-copy-registry.cjs`

## Environments
- 本地 Node.js test runner（`npm test`）。

## Automation Plan
- 增加 Edge Function 的 mock DB 测试。
- 为高风险流程增加一个可重复的 acceptance 脚本（synthetic），不依赖真实外部服务。

## Entry / Exit Criteria
- Entry: OpenSpec proposal + spec deltas 完成；测试用例清单确认。
- Exit: 新增测试通过 + `npm test` 通过 + copy registry 校验通过。

## Coverage Risks
- Clipboard API 在无权限或非安全上下文下可能失败 → 需要手动验证路径。
