---
name: frontend-ui-functional
description: Use when building or refactoring functional React/Vite/Tailwind UI pages, templates, or component libraries that need consistent structure, tokenized styling, accessibility checks, and performance-ready patterns.
---

# Frontend UI Functional

## Overview
Provide a lightweight, repeatable workflow for functional React/Vite/Tailwind UI using structure, tokens, accessibility, and performance-ready patterns plus reusable snippets.

## Project Overlay (Required)
If the repo contains `docs/skills/frontend-ui-functional/project-overlay.md`, read and apply it before starting. Project-specific rules override this skill.

## When to Use
- Building new UI pages, templates, or component libraries in React/Vite/Tailwind.
- Standardizing layout, token usage, a11y/accessibility, and performance practices across UI.
- Shipping functional UI quickly **without** skipping baseline a11y/perf checks.

## When Not to Use
- Pure copywriting/content strategy tasks.
- Non-React or non-Tailwind stacks.
- Deep visual branding exploration (use the `frontend-design` skill).

## Workflow (Minimum Pass)
0. **Project overlay check** → `docs/skills/frontend-ui-functional/project-overlay.md` (if present)
1. **Structure first** → `references/atomic-design.md`
2. **Apply styling tokens** → `references/styling-tokens.md`
3. **A11y pass** → `references/a11y-checklist.md`
4. **Performance + state pass** → `references/perf-and-state.md`
5. **Tooling + QA** → `references/tooling.md`

If time is tight, do a thin pass of **each** step rather than skipping a11y/perf.

## Quick Reference
| Need | Use |
| --- | --- |
| Project overlay | `docs/skills/frontend-ui-functional/project-overlay.md` (if present) |
| Structure system | `references/atomic-design.md` |
| Tokenized styling | `references/styling-tokens.md` |
| Accessibility/a11y | `references/a11y-checklist.md` |
| Performance + state | `references/perf-and-state.md` |
| QA tooling | `references/tooling.md` |
| Reusable UI snippets | `assets/snippets/*` |

## Reusable Snippets
- Button: `assets/snippets/button.tsx`
- Card: `assets/snippets/card.tsx`
- Form: `assets/snippets/form.tsx`
- Layout: `assets/snippets/layout.tsx`
- Lazy Route Boundary: `assets/snippets/lazy-route.tsx`
- Zustand Store: `assets/snippets/zustand-store.ts`

## Example (Single)
Note: replace literal strings with your project's copy/content source when applicable.
```tsx
import { Button } from "./button";
import { Card } from "./card";
import { PageLayout } from "./layout";

export function DashboardStub() {
  return (
    <PageLayout title="Overview" actions={<Button label="Create" />}>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Revenue" description="Last 30 days">
          <div className="text-2xl font-semibold text-primary">$128,400</div>
        </Card>
        <Card title="Active Users" description="Daily active">
          <div className="text-2xl font-semibold text-primary">4,812</div>
        </Card>
      </div>
    </PageLayout>
  );
}
```

## Common Mistakes
- Skipping a11y/perf due to time pressure; do the minimum pass instead.
- Hardcoding colors instead of using tokens from `references/styling-tokens.md`.
- Mixing layout decisions with visual polish before the structure is stable.
