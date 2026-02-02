<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Canvas 规则

- 每次创建/修改/删除前必须先查阅 `architecture.canvas`，确认受影响的节点。
- 制定计划前必须先更新 Canvas：运行 `node scripts/ops/architecture-canvas.cjs`；若脚本不可用，手动更新并保持节点格式与已有节点一致。
- 全流程结束后必须再次更新 Canvas，保证节点格式与现有节点保持同步。
- 渐进式披露：阅读架构时先运行 `node scripts/ops/architecture-canvas.cjs --list-modules` 获取模块，再用 `--focus <module> --out architecture.focus.canvas` 生成聚焦画布；阅读时只打开 `architecture.focus.canvas`，需要全量时再查看 `architecture.canvas`。
- 渐进式披露粒度：小改动聚焦单模块；中等改动在同模块内扩展相邻模块（必要时多次 `--focus`）；跨模块/数据流改动先逐步扩展，只有依赖仍不清楚时才打开全量 `architecture.canvas`。

## Canvas 执行边界（强制 vs 可选）

**强制（必须读 + 更新 Canvas）**
- 架构变更或系统边界调整
- 数据流/存储/同步路径变化
- 公共接口或契约改变（API、事件、数据模型）
- 跨模块耦合关系调整

**可选（允许跳过 Canvas 读/更）**
- 局部 bugfix（不影响模块边界/数据流）
- 纯文案/样式/格式类改动
- 孤立脚本修补（不进入核心流程）

**最小摩擦执行规则**
1) 变更前判断是否触发“强制”条件  
2) 触发则执行 Canvas 读 + 更新；不触发可跳过  
3) 提交信息或 PR 描述可附一句：`Canvas: updated` 或 `Canvas: not required`

## SQLite 使用习惯（渐进式披露）

- 定位顺序：先用 Canvas 缩小范围（模块/路径前缀），再用 SQLite 精确查询。  
- 查询原则：只输出最小结果集（几十/几百行以内），禁止全量导出。  
- 模板优先：使用 `docs/graph/sql-templates.md` 的固定 SQL，避免手写出错。  
- 目标定位：SQLite 仅负责“符号级事实定位”，输出结果再交给 AI。  
# OpenSpec 使用范围

- 默认使用 skill 工作流，不强制走 OpenSpec。
- 仅在以下“重大模块”场景触发 OpenSpec：外部集成、跨模块核心流程、DB schema 变更、安全/权限边界变化、破坏性变更。

# 文案规则（Copy Registry）

- 本项目页面上所有展示文字必须来自 `dashboard/src/content/copy.csv`。
- 任何文案改动必须汇总到文案表，不允许在组件内新增/修改硬编码文本。
- 文案表与项目官网内容必须双向同步：官网改动需回写文案表，文案表更新需同步到官网。

# 回归用例要求

- 每次提交必须执行回归用例（至少覆盖本次变更相关路径），并记录执行命令与结果。

# PR 预检与风险层门禁

- PR 模板必须填写 `Affected Modules / Dependency Notes` 与 `Codex Context`，跨模块变更需附 Canvas evidence（聚焦画布或更新说明）。
- 若 Risk Layer Trigger 勾选任一项，必须补全 Addendum（Rules/Invariants、Boundary Matrix ≥ 3、Evidence）。
- CI 会执行 `node scripts/ops/pr-risk-layer-gate.cjs`；本地可用 `--body-file` 预检。
- 详细流程见 `docs/ops/pr-review-preflight.md`。

# 工作流规则（Workflow）

- 完成代码后仅执行本地提交（git commit），未经用户明确指示不得推送（git push）。

# 部署规则（Deployment）

- 所有函数都通过 Insforge2 MCP 部署。

# Insforge 聚合与契约（PostgREST）

- 聚合查询统一使用 `sum(column)` 语法，禁止使用 `column.sum()`。
- 新增/修改聚合接口必须有真实 Insforge2 环境 smoke 验证（至少 1 次请求 200 + 合理响应）。
- 若出现 `schema cache` / `relationship` + `'sum'` 相关错误，应直接走聚合 fallback 逻辑并记录根因。
- Smoke 脚本：`scripts/ops/insforge2-smoke-project-usage-summary.cjs`（需要 `VIBEUSAGE_INSFORGE_BASE_URL` 与 `VIBEUSAGE_USER_JWT`）。
