# Accessibility Checklist

## Goal
Ensure keyboard, screen reader, and contrast compliance by default.

## Rules
- Every interactive element must be keyboard reachable.
- Label all controls (visible or aria-label).
- Provide focus-visible styles.

## Do
- Use semantic HTML first.
- Add ARIA only when semantics are insufficient.
- Run `axe-core` checks for key pages/components.

## Don't
- Use `div`/`span` for buttons or links.
- Hide focus outlines.
- Ship without a11y spot checks.

## Minimal Example
- `button` for actions
- `label` + `input` pairing
- `aria-live` for dynamic alerts
