# Frontend Foundation Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改变视觉效果的前提下，重构 Dashboard 前端 UI 组件与页面结构，使组件职责清晰、数据流单向、维护成本显著下降，同时保证截图基线稳定可复现。

**Architecture:** 保持现有功能与数据来源不变；新增 `ui/foundation` 作为 UI 原语层，页面层改为“容器 + 展示”拆分；不引入长期双轨或兼容路径。

**Tech Stack:** React, Vite, 现有 CSS/Matrix UI A 组件体系，Playwright 截图脚本（已有）。


**Scope:**
- Frontend only (`dashboard/`).
- No API changes, no new UI copy.
- Baselines and screenshot stability improvements.

---

### Task 1: 创建隔离工作区（工作流要求）

**Files:**
- Modify: `.gitignore`（若 worktree 目录未忽略）

**Step 1: 确认 worktree 目录策略**
Run:
```bash
git rev-parse --show-toplevel
ls -d .worktrees 2>/dev/null || ls -d worktrees 2>/dev/null
```
Expected: 看到 `.worktrees/` 或 `worktrees/`，若不存在则新建 `.worktrees/`。

**Step 2: 确保 worktree 被忽略**
Run:
```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```
Expected: 退出码 0。若非 0，追加到 `.gitignore`。

**Step 3: 创建 worktree**
Run:
```bash
branch=feat/frontend-foundation-refactor
path=.worktrees/$branch
mkdir -p .worktrees

git worktree add "$path" -b "$branch"
cd "$path"
```
Expected: 新分支 worktree 创建成功。

**Step 4: 安装依赖**
Run:
```bash
npm install
```
Expected: 依赖安装成功。

**Step 5: 提交 .gitignore（若修改）**
```bash
git add .gitignore
git commit -m "chore: ignore worktrees directory"
```

---

### Task 2: 视觉基线的“存在性”测试（TDD 起点）

**Files:**
- Create: `test/visual-baselines.test.js`

**Step 1: 写一个会失败的测试（基线文件尚不存在）**
```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const required = [
  path.resolve("docs/screenshots/baselines/2026-01-23/dashboard-desktop.png"),
  path.resolve("docs/screenshots/baselines/2026-01-23/dashboard-mobile.png"),
  path.resolve("docs/screenshots/baselines/2026-01-23/landing-desktop.png"),
];

test("visual baselines exist", () => {
  for (const file of required) {
    assert.ok(fs.existsSync(file), `missing baseline: ${file}`);
  }
});
```

**Step 2: 运行测试，确认失败**
Run:
```bash
node --test test/visual-baselines.test.js
```
Expected: FAIL，提示缺少 baseline 文件。

---

### Task 3: 生成视觉基线截图（使用现有 Playwright 脚本）

**Files:**
- Create: `dashboard/scripts/capture-visual-baselines.mjs`
- Modify: `docs/screenshots/baselines/2026-01-23/*.png`（生成）

**Step 1: 新增批量截图脚本**
```js
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const baseUrl = process.env.BASELINE_BASE_URL || "http://localhost:5173";
const mock = "mock=1&mock_seed=baseline&mock_today=2025-12-31&mock_now=2025-12-31T12:00:00Z";

const jobs = [
  {
    name: "dashboard-desktop",
    url: `${baseUrl}/?screenshot=1&${mock}`,
    width: 1512,
    height: 997,
    dpr: 2,
  },
  {
    name: "dashboard-mobile",
    url: `${baseUrl}/?screenshot=1&${mock}`,
    width: 390,
    height: 844,
    dpr: 2,
  },
  {
    name: "landing-desktop",
    url: `${baseUrl}/?screenshot=1`,
    width: 1440,
    height: 900,
    dpr: 2,
  },
  {
    name: "share-desktop",
    url: `${baseUrl}/share/baseline?screenshot=1&${mock}`,
    width: 1440,
    height: 900,
    dpr: 2,
  },
];

const outDir = path.resolve("docs/screenshots/baselines/2026-01-23");
const script = path.resolve("dashboard/scripts/capture-dashboard-screenshot.mjs");

async function run() {
  for (const job of jobs) {
    const out = path.join(outDir, `${job.name}.png`);
    await exec("node", [
      script,
      "--url",
      job.url,
      "--out",
      out,
      "--width",
      String(job.width),
      "--height",
      String(job.height),
      "--dpr",
      String(job.dpr),
      "--wait",
      "1200",
    ]);
    console.log(`Captured ${job.name}: ${out}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Step 2: 启动 dev server（mock）**
Run:
```bash
npm --prefix dashboard run dev
```
Expected: 服务器运行于 `http://localhost:5173`。

**Step 3: 生成 baseline**
Run:
```bash
node dashboard/scripts/capture-visual-baselines.mjs
```
Expected: 生成三张 baseline PNG。

**Step 4: 运行测试（应通过）**
Run:
```bash
node --test test/visual-baselines.test.js
```
Expected: PASS。

**Step 5: 提交基线与脚本**
```bash
git add test/visual-baselines.test.js dashboard/scripts/capture-visual-baselines.mjs docs/screenshots/baselines/2026-01-23/*.png
git commit -m "test: add visual baselines for frontend refactor"
```

---

### Task 4: 建立可复现的基线配置（Deterministic Baselines）

**Files:**
- Create: `dashboard/src/lib/screenshot-mode.js`
- Create: `dashboard/scripts/visual-baseline-config.js`
- Modify: `dashboard/scripts/capture-visual-baselines.mjs`
- Modify: `dashboard/src/pages/LandingPage.jsx`
- Modify: `dashboard/src/pages/DashboardPage.jsx`
- Modify: `dashboard/src/App.jsx`
- Tests: `test/screenshot-mode.test.js`, `test/visual-baseline-config.test.js`

**Steps:**
1. 引入 `?screenshot=1` 标记与工具函数。
2. 基线脚本使用稳定 URL（Dashboard 走 mock，Landing 走真实 Landing + screenshot）。
3. 截图模式下屏蔽弹窗/遮罩干扰。
4. 通过测试验证 URL 与行为。

---

### Task 5: 禁用截图期间的非确定性 UI 行为

**Files:**
- Modify: `dashboard/src/ui/matrix-a/components/ScrambleText.jsx`
- Modify: `dashboard/src/ui/matrix-a/components/LiveSniffer.jsx`
- Modify: `dashboard/src/ui/matrix-a/components/GithubStar.jsx`
- Create: `dashboard/src/ui/matrix-a/util/should-scramble.js`
- Create: `dashboard/src/ui/matrix-a/util/should-run-live-sniffer.js`
- Create: `dashboard/src/ui/matrix-a/util/should-fetch-github-stars.js`
- Tests: `test/should-scramble.test.js`, `test/should-run-live-sniffer.test.js`, `test/should-fetch-github-stars.test.js`

**Steps:**
1. 引入工具函数，按 `prefers-reduced-motion` / screenshot mode 关闭随机与请求。
2. 覆盖 ScrambleText/LiveSniffer/GithubStar 的非确定性行为。
3. 通过测试锁定行为。

---

### Task 6: 建立 UI Foundation 目录与基础导出

**Files:**
- Create: `dashboard/src/ui/foundation/index.js`
- Create: `dashboard/src/ui/foundation/README.md`

**Step 1: 添加基础目录与说明**
```md
# UI Foundation

Purpose: UI 原语层（布局 / 输入 /装饰）。只负责视图，不包含业务逻辑或数据请求。
```

**Step 2: 导出占位 index**
```js
export * from "./AsciiBox.jsx";
export * from "./MatrixButton.jsx";
export * from "./MatrixInput.jsx";
export * from "./MatrixAvatar.jsx";
export * from "./SignalBox.jsx";
```

**Step 3: 提交**
```bash
git add dashboard/src/ui/foundation
 git commit -m "chore: add ui foundation scaffold"
```

---

### Task 7: 迁移基础 UI 原语（第 1 批）

**Files:**
- Move: `dashboard/src/ui/matrix-a/components/AsciiBox.jsx` → `dashboard/src/ui/foundation/AsciiBox.jsx`
- Move: `dashboard/src/ui/matrix-a/components/MatrixButton.jsx` → `dashboard/src/ui/foundation/MatrixButton.jsx`
- Move: `dashboard/src/ui/matrix-a/components/MatrixInput.jsx` → `dashboard/src/ui/foundation/MatrixInput.jsx`
- Modify: 所有引用以上组件的文件

**Step 1: 移动文件并更新导入**
- 将文件移动到 `ui/foundation`。
- 更新所有 import 路径。

**Step 2: 运行视觉基线脚本（验证不变）**
Run:
```bash
node dashboard/scripts/capture-visual-baselines.mjs
```
Expected: 输出覆盖同名文件（后续用 git diff 校验）。

**Step 3: 校验视觉差异**
Run:
```bash
git diff --exit-code docs/screenshots/baselines/2026-01-23
```
Expected: 无 diff。

**Step 4: 提交**
```bash
git add dashboard/src/ui/foundation dashboard/src/ui/matrix-a docs/screenshots/baselines/2026-01-23
git commit -m "refactor: move basic ui primitives to foundation"
```

---

### Task 8: 迁移基础 UI 原语（第 2 批）

**Files:**
- Move: `dashboard/src/ui/matrix-a/components/MatrixAvatar.jsx` → `dashboard/src/ui/foundation/MatrixAvatar.jsx`
- Move: `dashboard/src/ui/matrix-a/components/SignalBox.jsx` → `dashboard/src/ui/foundation/SignalBox.jsx`
- Move: `dashboard/src/ui/matrix-a/components/DecodingText.jsx` → `dashboard/src/ui/foundation/DecodingText.jsx`
- Move: `dashboard/src/ui/matrix-a/components/ScrambleText.jsx` → `dashboard/src/ui/foundation/ScrambleText.jsx`
- Modify: 所有引用以上组件的文件

**Step 1: 移动文件并更新导入**

**Step 2: 运行 baseline 并检查 diff**
```bash
node dashboard/scripts/capture-visual-baselines.mjs
git diff --exit-code docs/screenshots/baselines/2026-01-23
```
Expected: 无 diff。

**Step 3: 提交**
```bash
git add dashboard/src/ui/foundation dashboard/src/ui/matrix-a docs/screenshots/baselines/2026-01-23
git commit -m "refactor: move text/avatar primitives to foundation"
```

---

### Task 9: Layout 组件迁移

**Files:**
- Move: `dashboard/src/ui/matrix-a/layout/MatrixShell.jsx` → `dashboard/src/ui/foundation/MatrixShell.jsx`
- Modify: 相关引用

**Step 1: 移动文件并更新导入**

**Step 2: 运行 baseline 并检查 diff**
```bash
node dashboard/scripts/capture-visual-baselines.mjs
git diff --exit-code docs/screenshots/baselines/2026-01-23
```
Expected: 无 diff。

**Step 3: 提交**
```bash
git add dashboard/src/ui/foundation dashboard/src/ui/matrix-a docs/screenshots/baselines/2026-01-23
git commit -m "refactor: move matrix shell to foundation"
```

---

### Task 10: 页面层容器 / 展示拆分（Dashboard）

**Files:**
- Create: `dashboard/src/ui/matrix-a/views/DashboardView.jsx`
- Modify: `dashboard/src/pages/DashboardPage.jsx`

**Step 1: 新建 DashboardView（展示层）**
- 从 `DashboardPage.jsx` 中移动纯渲染 JSX 到 `DashboardView.jsx`。
- 仅接收 props（不调用 hooks / API）。

**Step 2: DashboardPage 作为容器**
- 保留数据获取与状态拼装。
- 将数据作为 props 传入 `DashboardView`。

**Step 3: baseline 校验**
```bash
node dashboard/scripts/capture-visual-baselines.mjs
git diff --exit-code docs/screenshots/baselines/2026-01-23
```
Expected: 无 diff。

**Step 4: 提交**
```bash
git add dashboard/src/pages/DashboardPage.jsx dashboard/src/ui/matrix-a/views/DashboardView.jsx docs/screenshots/baselines/2026-01-23
git commit -m "refactor: split dashboard page container/view"
```

---

### Task 11: 页面层容器 / 展示拆分（Landing）

**Files:**
- Create: `dashboard/src/ui/matrix-a/views/LandingView.jsx`
- Modify: `dashboard/src/pages/LandingPage.jsx`

**Step 1: 新建 LandingView（展示层）**
- 从 `LandingPage.jsx` 中移动纯渲染 JSX 到 `LandingView.jsx`。

**Step 2: LandingPage 作为容器**
- 保留必要的 hooks 与状态。

**Step 3: baseline 校验**
```bash
node dashboard/scripts/capture-visual-baselines.mjs
git diff --exit-code docs/screenshots/baselines/2026-01-23
```
Expected: 无 diff。

**Step 4: 提交**
```bash
git add dashboard/src/pages/LandingPage.jsx dashboard/src/ui/matrix-a/views/LandingView.jsx docs/screenshots/baselines/2026-01-23
git commit -m "refactor: split landing page container/view"
```

---

### Task 12: 清理与最终回归

**Files:**
- Modify: `dashboard/src/ui/matrix-a/components/*`（删除已迁移项）
- Modify: `architecture.canvas`（更新 Proposed → Implemented）

**Step 1: 清理旧路径**
- 删除 `ui/matrix-a/components` 中已迁移文件。
- 确保无残留 import。

**Step 2: 运行测试与基线**
```bash
node --test test/visual-baselines.test.js
node dashboard/scripts/capture-visual-baselines.mjs
git diff --exit-code docs/screenshots/baselines/2026-01-23
node --test test/landing-screenshot.test.js
```
Expected: 全部 PASS + 无 diff。

**Step 3: 更新 Canvas**
Run:
```bash
node scripts/ops/architecture-canvas.cjs
```
Then update `UI Foundation (Proposed)` → `Status: Implemented`。

**Step 4: 提交最终清理**
```bash
git add dashboard/src/ui/matrix-a dashboard/src/ui/foundation architecture.canvas docs/screenshots/baselines/2026-01-23
git commit -m "refactor: finalize ui foundation migration"
```

---

## Execution Handoff
Plan 已保存到 `docs/plans/2026-01-23-frontend-foundation-implementation.md`。执行方式二选一：

1. **Subagent-Driven (this session)** - 我在本会话逐任务执行并自检
2. **Parallel Session (separate)** - 新会话使用 executing-plans 分阶段执行

你选哪种？

## Verification

Run:
```bash
node --test test/screenshot-mode.test.js test/visual-baseline-config.test.js
node --test test/should-scramble.test.js test/should-run-live-sniffer.test.js test/should-fetch-github-stars.test.js
node --test test/should-defer-mount.test.js test/visual-baselines.test.js
node dashboard/scripts/capture-visual-baselines.mjs
```

Expected:
- Tests pass.
- Baseline capture is stable across repeated runs.
