# Frontend UI Functional Skill + Skills Canvas Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a frontend UI functional skill (deliverable B: workflow + reusable snippets) and a skills relationship canvas as the single source of truth.

**Architecture:** Use `skills.canvas` to capture skill modules and dependencies. Create `skills/public/frontend-ui-functional` with `SKILL.md`, `references/` for workflows, `assets/` for snippets. Refresh `architecture.canvas` before and after changes.

**Tech Stack:** JSON Canvas 1.0, Markdown, Python skill-creator scripts, Node.js architecture-canvas script, React/Vite/Tailwind/Zustand/Storybook/axe-core (as target stack described by the skill).

---

### Task 1: Establish worktree and architecture baseline

**Files:**
- Modify: `architecture.canvas`

**Step 1: Create a dedicated worktree**
- Use `@using-git-worktrees` to create an isolated worktree.

**Step 2: Generate the latest architecture canvas**
Run: `node scripts/ops/architecture-canvas.cjs`
Expected: `architecture.canvas` generated without errors.

**Step 3: Generate focused canvas**
Run: `node scripts/ops/architecture-canvas.cjs --list-modules`
Run: `node scripts/ops/architecture-canvas.cjs --focus root --out architecture.focus.canvas`
Expected: `architecture.focus.canvas` generated.

---

### Task 2: Extract reusable modules and constraints

**Files:**
- Read: `/Users/victor/.codex/skills/frontend-design/SKILL.md`
- Read: `/Users/victor/.codex/skills/react-best-practices/SKILL.md`
- Read: `/Users/victor/.codex/skills/.system/skill-creator/SKILL.md`
- Read: `AGENTS.md`

**Step 1: Compile reusable module list**
- Atomic Design
- Styling tokens/patterns
- A11y checks (ARIA/axe-core)
- Performance + state
- Tooling (Storybook/ESLint/Prettier)

**Step 2: Record project-specific constraints**
- Copy Registry: all UI text must come from `dashboard/src/content/copy.csv`.

---

### Task 3: Create `skills.canvas` (single source of truth)

**Files:**
- Create: `skills.canvas`
- Modify: `architecture.canvas`

**Step 1: Create `skills.canvas` (JSON Canvas)**
Use `@json-canvas` to create a valid `.canvas` file with:
- Nodes: Core Flow, Atomic, Styling, A11y, Performance, Tooling, Templates
- Edges: structure -> style -> a11y -> performance; atomic -> templates; core flow -> atomic

**Step 2: Refresh architecture canvas**
Run: `node scripts/ops/architecture-canvas.cjs`
Expected: `skills.canvas` reflected in `architecture.canvas`.

---

### Task 4: Initialize skill directory

**Files:**
- Create: `skills/public/frontend-ui-functional/`

**Step 1: Initialize**
Run:
```bash
python /Users/victor/.codex/skills/.system/skill-creator/scripts/init_skill.py \
  frontend-ui-functional \
  --path skills/public \
  --resources references,assets
```
Expected: `SKILL.md`, `references/`, `assets/` generated.

---

### Task 5: Create workflows and snippet assets

**Files:**
- Create: `skills/public/frontend-ui-functional/references/atomic-design.md`
- Create: `skills/public/frontend-ui-functional/references/styling-tokens.md`
- Create: `skills/public/frontend-ui-functional/references/a11y-checklist.md`
- Create: `skills/public/frontend-ui-functional/references/perf-and-state.md`
- Create: `skills/public/frontend-ui-functional/references/tooling.md`
- Create: `skills/public/frontend-ui-functional/assets/snippets/button.tsx`
- Create: `skills/public/frontend-ui-functional/assets/snippets/card.tsx`
- Create: `skills/public/frontend-ui-functional/assets/snippets/form.tsx`
- Create: `skills/public/frontend-ui-functional/assets/snippets/layout.tsx`
- Create: `skills/public/frontend-ui-functional/assets/snippets/lazy-route.tsx`
- Create: `skills/public/frontend-ui-functional/assets/snippets/zustand-store.ts`

**Step 1: Write references**
- Each file includes: goal, rules, do/don't, minimal example.
- Keep each file < 200 lines.

**Step 2: Write snippets**
- TypeScript + React function components.
- Tailwind tokenized classes.
- Text placeholders only, do not hardcode real copy (use Copy Registry).

---

### Task 6: Author SKILL.md

**Files:**
- Modify: `skills/public/frontend-ui-functional/SKILL.md`

**Step 1: Update frontmatter**
- name: `frontend-ui-functional`
- description: Trigger contexts for building/standardizing UI, a11y/perf review, and snippet reuse.

**Step 2: Write body**
- Overview
- Workflow Decision Tree (Structure -> Style -> A11y -> Performance -> QA)
- Core Modules (links to references)
- Templates (links to assets)
- Project Constraints (Copy Registry)

---

### Task 7: Validate and package

**Files:**
- Modify: `skills/public/frontend-ui-functional/SKILL.md` (fix validation errors if any)
- Create: `dist/frontend-ui-functional.skill` (optional)

**Step 1: Quick validate**
Run:
```bash
python /Users/victor/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  skills/public/frontend-ui-functional
```
Expected: `Skill is valid!`

**Step 2: Package**
Run:
```bash
python /Users/victor/.codex/skills/.system/skill-creator/scripts/package_skill.py \
  skills/public/frontend-ui-functional \
  dist
```
Expected: `dist/frontend-ui-functional.skill`

---

### Task 8: Document and final sync

**Files:**
- Create: `docs/plans/2026-01-24-frontend-ui-functional-design.md`
- Modify: `architecture.canvas`

**Step 1: Write design summary**
- Document module boundaries, dependencies, reuse rules, and why deliverable B.

**Step 2: Refresh architecture canvas**
Run: `node scripts/ops/architecture-canvas.cjs`
Expected: `architecture.canvas` aligned with changes.
