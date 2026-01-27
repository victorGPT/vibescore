# PR Review Cycle Retro Postmortem Skill Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the `pr-review-cycle-retro` skill to produce a project-style postmortem report (验尸报告) rather than a churn-only analysis, and validate it with pressure scenarios.

**Architecture:** Keep the skill as the single source of truth in `~/.codex/skills/pr-review-cycle-retro/SKILL.md`. Use pressure scenarios (subagents) as tests to prove the new report format and content rules.

**Tech Stack:** Markdown, subagent tooling, local file edits.

---

### Task 1: Baseline (RED) pressure scenario

**Files:**
- Read: `~/.codex/skills/pr-review-cycle-retro/SKILL.md`
- Evidence log: `docs/retrospective/2026-01-26-pr-review-cycle-retro-skill-test.md`

**Step 1: Run baseline scenario (no skill update)**
Prompt a subagent to produce a “project postmortem” for PR #89 using the current skill. Capture the output and note why it fails (missing sections, churn-only framing, no project-level acceptance/impact/lessons).

**Step 2: Record failure rationale**
Write the failure reasons into the evidence log with concrete examples from the output.

### Task 2: Update skill content (GREEN)

**Files:**
- Modify: `~/.codex/skills/pr-review-cycle-retro/SKILL.md`

**Step 1: Update description triggers**
Shift triggers to “project postmortem /验尸报告 after PR review churn or significant delivery” while keeping Codex review churn as a valid trigger.

**Step 2: Replace core workflow**
Define a project postmortem structure (scope, goals, outcome vs plan, impact, root causes, stage attribution, evidence, action items with owners/dates, prevention rules). Provide a concise template.

**Step 3: Clarify artifacts**
Make Markdown report the required output. Mark JSON/CSV as optional supporting artifacts (internal only), and explain the audience for each.

### Task 3: Re-run pressure scenario (GREEN)

**Files:**
- Evidence log: `docs/retrospective/2026-01-26-pr-review-cycle-retro-skill-test.md`

**Step 1: Re-run scenario with updated skill**
Prompt a subagent to generate the same report and verify it follows the template and includes required sections.

**Step 2: Record pass evidence**
Write pass notes and any residual gaps.

### Task 4: Refactor and close loopholes

**Files:**
- Modify: `~/.codex/skills/pr-review-cycle-retro/SKILL.md`

**Step 1: Add common rationalizations**
Add a short “Common Mistakes / Rationalization” section to prevent slipping back into churn-only summaries.

### Task 5: Verification and commit

**Files:**
- Modify: `~/.codex/skills/pr-review-cycle-retro/SKILL.md`
- Modify: `docs/retrospective/2026-01-26-pr-review-cycle-retro-skill-test.md`

**Step 1: Verification (manual)**
Record the two pressure scenario runs as the regression evidence. No automated tests exist for skills.

**Step 2: Commit**
```bash
git add ~/.codex/skills/pr-review-cycle-retro/SKILL.md docs/retrospective/2026-01-26-pr-review-cycle-retro-skill-test.md
git commit -m "docs: update pr-review-cycle-retro skill to project postmortem"
```
