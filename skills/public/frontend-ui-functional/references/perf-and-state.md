# Performance and State

## Goal
Reduce rerenders and bundle size while keeping state predictable.

## Rules
- Keep state flat and local by default.
- Introduce global state only when multiple views need it.
- Lazy-load heavy routes and charts.

## Do
- Split routes with `React.lazy` and `Suspense`.
- Use selectors for Zustand to avoid re-rendering.
- Prefer derived state with `useMemo` when needed.

## Don't
- Store large derived data in global state.
- Trigger renders from unrelated state changes.
- Load heavy components in the initial bundle.

## Minimal Example
- `const useStore = create((set) => ({ ... }))`
- `const value = useStore((s) => s.value)`
- Lazy route boundary with fallback
