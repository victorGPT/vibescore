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

# 文案规则（Copy Registry）

- 本项目页面上所有展示文字必须来自 `dashboard/src/content/copy.csv`。
- 任何文案改动必须汇总到文案表，不允许在组件内新增/修改硬编码文本。
- 文案表与项目官网内容必须双向同步：官网改动需回写文案表，文案表更新需同步到官网。

# 回归用例要求

- 每次提交必须执行回归用例（至少覆盖本次变更相关路径），并记录执行命令与结果。

# 工作流规则（Workflow）

- 完成代码后仅执行本地提交（git commit），未经用户明确指示不得推送（git push）。
