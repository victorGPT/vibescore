# Tooling

## Goal
Keep UI quality consistent with automated checks and component docs.

## Rules
- Document core components in Storybook.
- Enforce lint/format on PR and locally.
- Add a11y checks to Storybook where possible.

## Do
- Storybook stories for Button, Card, Form, Layout.
- ESLint + Prettier to standardize style.
- Include a11y addon or axe checks in CI.

## Don't
- Skip docs for reusable components.
- Use inconsistent lint rules per module.
- Rely only on manual UI review.

## Minimal Example
- `stories/Button.stories.tsx`
- `eslint --max-warnings=0`
