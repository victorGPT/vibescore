## 1. Spec Updates
- [x] 1.1 Add Public View avatar requirements delta in `specs/vibeusage-tracker/spec.md`.

## 2. Backend (InsForge)
- [x] 2.1 Extend `vibeusage-public-view-profile` to return `avatar_url` (http/https only, max length, else `null`).
- [x] 2.2 Add backend tests or assertions for avatar sanitization (existing test file or new unit test).

## 3. Frontend (Dashboard)
- [x] 3.1 Fetch `avatar_url` in public mode and store in state.
- [x] 3.2 Update `IdentityCard` to render avatar image with `onError` fallback to `MatrixAvatar`.
- [x] 3.3 Update public view tests to cover avatar behavior.

## 4. Docs & Build
- [x] 4.1 Update `BACKEND_API.md` for `public-view-profile` response.
- [x] 4.2 Run `npm run build:insforge` to regenerate `insforge-functions/`.
- [x] 4.3 Run regression: `node --test test/public-view.test.js` (plus any impacted suite).
