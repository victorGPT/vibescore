# Tasks

## 1. Implementation
- [x] 1.1 Copy runtime dependencies into `~/.vibescore/tracker/app/node_modules` during `init`.
- [x] 1.2 Add dependency readiness check in notify handler and fall back to `npx` when missing.

## 2. Tests
- [x] 2.1 Add acceptance script `scripts/acceptance/notify-local-runtime-deps.cjs`.
- [x] 2.2 Run notify chain verification (init idempotent, notify chain preserved, uninstall restores).

## 3. Verification
- [x] 3.1 Run `node scripts/acceptance/notify-local-runtime-deps.cjs` and record output.
- [x] 3.2 Manual verify `notify` triggers `sync --auto` updates `parse.updated_at`.
