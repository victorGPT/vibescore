# Insforge2 DB 校验（legacy 前缀与 helper 漂移）

## 目的
在部署/回滚 Insforge2 数据库变更后，快速发现：
- legacy 前缀残留（函数体、对象名、RLS）
- request header helper 缺失或漂移

单一事实来源：
- SQL：`scripts/ops/insforge2-db-validate.sql`
- 运行器：`scripts/ops/insforge2-db-validate.cjs`

## 前置条件
- 有效的 Insforge2 base URL 与 service role key
- 运行器需要访问 `/api/database/query`

## 运行方式
```bash
VIBEUSAGE_INSFORGE_BASE_URL=... \
VIBEUSAGE_SERVICE_ROLE_KEY=... \
node scripts/ops/insforge2-db-validate.cjs
```

## 超时（可选）
```bash
VIBEUSAGE_HTTP_TIMEOUT_MS=3000
```
- 单位毫秒，内部换算为 `curl --max-time` 秒
- 最小有效值约 1ms
- 未设置则不强制超时

## 失败判定
以下任一条件即失败并退出 1：
- HTTP 非 2xx
- 返回非 JSON
- 响应缺少 `rows` 数组
- Q1 缺失 helper 函数
- Q2/Q3/Q4 出现 legacy 泄漏

## 预期结果
通过时输出：
```
insforge2-db-validate: OK
```

## 注意事项
- 仅用于校验，不执行修复
- 修复应通过 rename/rollback 脚本完成：
  - `scripts/ops/rename-vibeusage-db.sql`
  - `scripts/ops/rename-vibeusage-db-rollback.sql`
