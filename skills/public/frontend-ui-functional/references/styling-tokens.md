# Styling Tokens

## Goal
Standardize visual language with semantic tokens, not raw values.

## Rules
- Use semantic tokens (e.g., `bg-surface`, `text-primary`) over hard-coded colors.
- Define tokens in Tailwind config or CSS variables.
- Keep spacing scale consistent (4/8/12/16/etc.).

## Do
- Create tokens for surface, border, text, accent, and state.
- Prefer utility classes bound to tokens.
- Align typography scale across components.

## Don't
- Hard-code hex values in components.
- Mix multiple spacing scales in the same component.
- Create component-specific colors without a token.

## Minimal Example
- `text-primary`, `text-muted`
- `bg-surface`, `bg-accent`
- `border-subtle`, `ring-focus`
