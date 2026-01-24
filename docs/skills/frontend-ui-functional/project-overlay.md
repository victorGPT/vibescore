# Frontend UI Functional - Project Overlay

## Scope
This overlay applies when using the `frontend-ui-functional` skill in this repository.

## Required Rules
- **Project rules first:** Read `CLAUDE.md` before starting. Project-level rules override the base skill.
- **Copy registry:** All user-facing text must come from `dashboard/src/content/copy.csv`. Update the registry and run `npm run validate:copy` after changes.
- **UI hardcode guardrails:** Run `npm run validate:ui-hardcode` before shipping UI changes.
- **Reuse UI primitives:** Prefer existing components in `dashboard/src/ui` and `dashboard/src/components` before creating new ones.
- **Pages and layouts:** Follow patterns in `dashboard/src/pages` and the current layouts used there.
- **Tokens and styles:** Use the Tailwind tokens from `dashboard/tailwind.config.cjs` and shared styles in `dashboard/src/styles.css`.

## Mandatory Checks (Before PR)
- **Hardcoded color audit:** run `rg -n "#[0-9a-fA-F]{3,6}|rgba\\(" dashboard/src` and replace matches with Tailwind tokens or CSS variables. If an exception is required, add a short comment explaining why.
- **Copy registry validation:** run `npm run validate:copy`.

## Notes
- If you add or change copy keys, ensure the website content stays in sync with the copy registry.
