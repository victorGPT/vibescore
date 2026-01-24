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

### Task 1: 创建隔离工作区（工作流要求）【Done】

**Files:**
- Modify: `.gitignore`（若 worktree 目录未忽略）

**Steps:**
1. 确认 worktree 目录策略。
2. 确保 worktree 目录被忽略。
3. 创建 worktree 并安装依赖。

---

### Task 2: 视觉基线“存在性”测试（TDD 起点）【Done】

**Files:**
- Create: `test/visual-baselines.test.js`

**Steps:**
1. 写失败测试（基线文件缺失）。
2. 运行测试，确认失败。

---

### Task 3: 生成视觉基线截图（基础脚本）【Done】

**Files:**
- Create: `dashboard/scripts/capture-visual-baselines.mjs`
- Modify: `docs/screenshots/baselines/2026-01-23/*.png`

**Steps:**
1. 新增批量截图脚本。
2. 启动 dev server。
3. 生成基线截图。
4. 运行存在性测试，确保通过。

---

### Task 4: 建立可复现的基线配置（Deterministic Baselines）【Done】

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

### Task 5: 禁用截图期间的非确定性 UI 行为【Done】

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

### Task 6: 迁移基础 UI 原语（第 1 批）【Done】

**Files:**
- Move: `dashboard/src/ui/matrix-a/components/AsciiBox.jsx` → `dashboard/src/ui/foundation/AsciiBox.jsx`
- Move: `dashboard/src/ui/matrix-a/components/MatrixButton.jsx` → `dashboard/src/ui/foundation/MatrixButton.jsx`
- Move: `dashboard/src/ui/matrix-a/components/MatrixInput.jsx` → `dashboard/src/ui/foundation/MatrixInput.jsx`
- Modify: 所有引用以上组件的文件
- Add: `dashboard/src/ui/foundation/index.js`

**Steps:**
1. 迁移文件并更新 import。
2. 运行基线脚本，确保视觉一致。

---

### Task 7: 迁移基础 UI 原语（第 2 批）【Done】

**Files:**
- Move: `dashboard/src/ui/matrix-a/components/MatrixAvatar.jsx` → `dashboard/src/ui/foundation/MatrixAvatar.jsx`
- Move: `dashboard/src/ui/matrix-a/components/SignalBox.jsx` → `dashboard/src/ui/foundation/SignalBox.jsx`
- Move: `dashboard/src/ui/matrix-a/components/DecodingText.jsx` → `dashboard/src/ui/foundation/DecodingText.jsx`
- Move: `dashboard/src/ui/matrix-a/components/ScrambleText.jsx` → `dashboard/src/ui/foundation/ScrambleText.jsx`
- Modify: 所有引用以上组件的文件

**Steps:**
1. 迁移文件并更新 import。
2. 运行基线脚本，确保视觉一致。

---

### Task 8: Layout 组件迁移【Done】

**Files:**
- Move: `dashboard/src/ui/matrix-a/layout/MatrixShell.jsx` → `dashboard/src/ui/foundation/MatrixShell.jsx`
- Modify: 相关引用

**Steps:**
1. 迁移文件并更新 import。
2. 运行基线脚本，确保视觉一致。

---

### Task 9: 页面层容器/展示拆分（Dashboard）【Done】

**Files:**
- Create: `dashboard/src/ui/matrix-a/views/DashboardView.jsx`
- Modify: `dashboard/src/pages/DashboardPage.jsx`

**Steps:**
1. 将纯 JSX 展示部分抽到 `DashboardView`。
2. `DashboardPage` 保留数据获取与状态拼装，传递 props。
3. 运行基线脚本，确保视觉一致。

---

### Task 10: 页面层容器/展示拆分（Landing）【Done】

**Files:**
- Create: `dashboard/src/ui/matrix-a/views/LandingView.jsx`
- Modify: `dashboard/src/pages/LandingPage.jsx`

**Steps:**
1. 将纯 JSX 展示部分抽到 `LandingView`。
2. `LandingPage` 保留 hooks 与状态，传递 props。
3. 运行基线脚本，确保视觉一致。

---

### Task 11: 清理与最终回归【Done】

**Files:**
- Modify/Delete: `dashboard/src/ui/matrix-a/components/*`（删除已迁移项）
- Modify: `architecture.canvas`（更新状态）

**Steps:**
1. 清理旧路径与残留 import。
2. 运行测试与基线核对。
3. 更新 Canvas（`Proposed` → `Implemented`）。

---

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
