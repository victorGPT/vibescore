---
name: pr-review-cycle-retro
description: Use when a team sees repeated @codex review cycles or Codex Cloud feedback churn and needs root-cause attribution by development stage.
---

# Codex Review Churn Analysis (PR Retrospective)

## Overview
Explain why Codex Cloud review had to be re-run. Attribute causes to specific development stages, not just PR outcomes.

## When to Use
- Multiple @codex review cycles on the same PR.
- The same feedback appears across successive Codex reviews.
- Follow-up fix PRs exist shortly after merge.
- You need stage-level causes (design / implementation / testing / review packaging / release).

When NOT to use:
- Human-review-only churn.
- Pure formatting or mechanical PRs.

## Core Pattern
1) **Select**: Find PRs with Codex review churn (comment -> code update -> Codex review).
2) **Isolate**: Filter only Codex Cloud reviews and actionable feedback.
3) **Evidence**: Collect a traceable chain (Codex feedback -> code change or follow-up fix).
4) **Classify**: Assign primary + secondary stage causes.
5) **Abstract**: Roll causes into a stable taxonomy.
6) **Aggregate**: Summarize causes across frontend/backends.
7) **Prevent**: Enforce the PR template risk-layer gate before any future @codex review.

## Quick Reference
| Item | Rule |
| --- | --- |
| Codex cycle | Codex review comment -> code update -> new Codex review |
| Evidence | Codex comment + fix commit OR follow-up fix PR OR regression doc |
| Stage attribution | design / implementation / testing / review packaging / release |
| Mixed PR | record both frontend and backend impact |
| Noise guard | if Codex comments are generic, mark low-signal |
| Risk-layer gate | if any trigger matches, fill the addendum before @codex review |

## Stage Taxonomy (Definition)
- **Design**: missing requirements, unclear acceptance criteria, privacy/exposure gaps, cross-endpoint invariants not specified.
- **Implementation**: logic errors, incomplete edge cases, inconsistent ordering/aggregation.
- **Testing**: missing regression/E2E/contract tests, no reproduction script.
- **Review Packaging**: PR lacks context, spec, evidence, or minimal repro for Codex to review well.
- **Release/Integration**: environment constraints (gateway, permissions, paths), deploy-time mismatches.

## Cause Taxonomy (Abstract)
- **Spec Gap**: requirement or invariant not defined.
- **Context Gap**: Codex lacked PR context (spec, expected behavior, tests).
- **Implementation Drift**: code diverged from intent or was inconsistent across modules.
- **Test Gap**: no automated proof for edge cases or invariants.
- **Integration Constraint**: environment or platform limitations discovered late.

## Implementation (Repo-Specific)
Baseline candidate list (optional):

```bash
node scripts/ops/pr-retro.cjs \
  --since YYYY-MM-DD \
  --min-cycles 3 \
  --limit 5 \
  --out-dir docs/retrospective \
  --max-prs 80
```

Then isolate Codex Cloud feedback per PR:

```bash
gh pr view <num> --json reviews,comments --jq '(.reviews + .comments) | map(select(.author.login == "chatgpt-codex-connector"))'
```

Output notes:
- `docs/retrospective/YYYY-MM-DD-pr-retro.json` keeps summary fields for all PRs; `picked` contains full detail (reviews/comments/commits/files) for the selected PRs only.
- `docs/retrospective/YYYY-MM-DD-pr-retro.csv` is built from the `picked` list.

## Risk-Layer Gate (Preventive)
Before requesting @codex review, check `.github/PULL_REQUEST_TEMPLATE.md`:
- If any **Risk Layer Trigger** is checked, you MUST fill the **Risk Layer Addendum**.
- Provide rules/invariants, boundary matrix (>=3), and evidence (tests or repro).
- Summarize these items in **Codex Context** so Codex sees the delta clearly.

## Evidence Rules
- Each PR must cite at least 1 evidence item.
- If Codex feedback is generic, mark **low-signal** and rely on follow-up fixes or PR gate docs.
- Do not infer root cause without a traceable artifact.

## Common Mistakes
- Treating Codex review count as the root cause.
- Ignoring PR context quality (tests, spec links, repro steps).
- Mixing symptoms (bug) with stage cause (missing invariant).
- Skipping frontend/backend split on mixed PRs.
- Triggering @codex review without completing the risk-layer addendum.

## Rationalization Table
| Excuse | Reality |
| --- | --- |
| "Codex asked again, so it's Codex's fault" | Repeated reviews usually reflect missing context or gaps in our stages. |
| "Review cycles are enough" | Cycles show churn, not cause. Evidence is required. |
| "Titles explain the issue" | Titles are symptoms, not root causes. |
| "We fixed it later, so root cause is obvious" | Fixes show symptom; stage attribution still required. |
| "Template is optional" | Risk-layer addendum is mandatory when any trigger matches. |

## Red Flags - STOP
- No evidence chain from Codex feedback to code change.
- All Codex comments are generic and no follow-up fixes exist.
- Root cause stated without stage attribution.
- Evidence relies only on PR title or description.
