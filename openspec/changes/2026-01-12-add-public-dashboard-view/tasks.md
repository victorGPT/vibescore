# 任务清单：Public Dashboard View

## 1. 规划与规范
- [x] 1.1 完成 requirements / acceptance / test-strategy / module-brief / milestones。
- [x] 1.2 起草并校验 OpenSpec proposal + spec delta。

## 2. 后端（Schema + Edge Functions）
- [x] 2.1 新增 `vibescore_public_views` SQL 与 RLS。
- [x] 2.2 新增 Public View issue/revoke/status edge functions。
- [x] 2.3 usage endpoints 支持 share token 只读访问。
- [x] 2.4 新增 acceptance script 覆盖 share link 生命周期。

## 3. 前端（Dashboard Public View）
- [x] 3.1 `/share/:token` 路由解析与 publicMode。
- [x] 3.2 Public View UI 控制面板（生成/复制/撤销）。
- [x] 3.3 publicMode 下隐藏登录/安装提示与 sign-out。
- [x] 3.4 copy registry 更新并通过校验。

## 4. 验证与交付
- [x] 4.1 新增/更新单元测试并保持绿。
- [x] 4.2 `npm run build:insforge:check` 通过。
- [x] 4.3 记录回归命令与结果。
- [x] 4.4 更新 `docs/deployment/freeze.md`。
