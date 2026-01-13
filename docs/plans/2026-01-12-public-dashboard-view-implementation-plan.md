# Public Dashboard View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a revocable public share link that renders the full dashboard at `/share/:token` with read-only access.

**Architecture:** Add share-token lifecycle edge functions + DB table, and extend usage endpoints to accept share tokens for read-only access. Frontend routes `/share/:token` to `DashboardPage` in public mode and exposes a share panel for logged-in users.

**Tech Stack:** React (Vite), node:test, InsForge edge functions (Deno), Postgres (RLS).

---

### Task 1: Public View routing + UI gate (frontend)

**Files:**
- Modify: `dashboard/src/App.jsx`
- Modify: `dashboard/src/pages/DashboardPage.jsx`
- Test: `test/public-view.test.js`

**Step 1: Write the failing test**

```js
// test/public-view.test.js
assert.match(src, /share/i);
assert.match(src, /publicMode/);
assert.match(src, /publicToken/);
```

**Step 2: Run test to verify it fails**

Run: `node --test test/public-view.test.js`
Expected: FAIL with missing `publicMode/publicToken` and share route.

**Step 3: Write minimal implementation**

```jsx
// dashboard/src/App.jsx
const pathname = pageUrl.pathname.replace(/\/+$/, "");
const shareMatch = pathname.match(/^\/share\/([^/]+)$/i);
const publicToken = shareMatch ? shareMatch[1] : null;
const publicMode = Boolean(publicToken) || pathname.startsWith("/share");
```

```jsx
// dashboard/src/pages/DashboardPage.jsx
export function DashboardPage({ publicMode = false, publicToken = null, ... }) {
  const accessTokenForData = publicMode ? publicToken : auth?.accessToken || null;
  const requireAuthGate = !publicMode && !signedIn && !mockEnabled && !sessionExpired;
}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/public-view.test.js`
Expected: share route + public mode tests pass.

**Step 5: Commit**

```bash
git add dashboard/src/App.jsx dashboard/src/pages/DashboardPage.jsx test/public-view.test.js
git commit -m "feat: add public view routing and gating"
```

---

### Task 2: Public View share panel + copy registry

**Files:**
- Modify: `dashboard/src/pages/DashboardPage.jsx`
- Modify: `dashboard/src/lib/vibescore-api.js`
- Modify: `dashboard/src/content/copy.csv`
- Modify: `dashboard/vercel.json`
- Test: `test/public-view.test.js`

**Step 1: Write the failing test**

```js
// test/public-view.test.js
assert.ok(src.includes("dashboard.public_view.title"));
```

**Step 2: Run test to verify it fails**

Run: `node --test test/public-view.test.js`
Expected: FAIL on missing copy keys + share rewrite.

**Step 3: Write minimal implementation**

```csv
// dashboard/src/content/copy.csv
...,
"dashboard.public_view.title",...,"Public View",...
"dashboard.public_view.subtitle",...,"Shareable dashboard link",...
```

```json
// dashboard/vercel.json
{
  "rewrites": [
    { "source": "/share/(.*)", "destination": "/share.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Step 4: Run test to verify it passes**

Run: `node --test test/public-view.test.js`
Expected: copy registry + rewrite tests pass.

**Step 5: Commit**

```bash
git add dashboard/src/content/copy.csv dashboard/vercel.json dashboard/src/pages/DashboardPage.jsx dashboard/src/lib/vibescore-api.js
git commit -m "feat: add public view panel and copy registry"
```

---

### Task 3: Share link schema + edge functions (backend)

**Files:**
- Create: `insforge-src/functions/vibescore-public-view-issue.js`
- Create: `insforge-src/functions/vibescore-public-view-revoke.js`
- Create: `insforge-src/functions/vibescore-public-view-status.js`
- Create: `insforge-src/shared/public-view.js`
- Modify: `insforge-src/shared/auth.js`
- Modify: `insforge-src/functions/vibescore-usage-*.js`
- Test: `test/public-view.test.js`

**Step 1: Write the failing test**

```js
// test/public-view.test.js
const issueSrc = read("insforge-src/functions/vibescore-public-view-issue.js");
```

**Step 2: Run test to verify it fails**

Run: `node --test test/public-view.test.js`
Expected: ENOENT for missing public view functions.

**Step 3: Write minimal implementation**

```js
// insforge-src/shared/public-view.js
async function resolvePublicView({ baseUrl, shareToken }) { /* lookup by token_hash */ }
```

```js
// insforge-src/functions/vibescore-public-view-issue.js
// Issues share token and stores token_hash.
```

```js
// insforge-src/functions/vibescore-usage-summary.js
const { getAccessContext } = require('../shared/auth');
const auth = await getAccessContext({ baseUrl, bearer, allowPublic: true });
```

**Step 4: Run test to verify it passes**

Run: `node --test test/public-view.test.js`
Expected: public view edge function tests pass.

**Step 5: Commit**

```bash
git add insforge-src/functions insforge-src/shared test/public-view.test.js
git commit -m "feat: add public view share tokens"
```

---

### Task 4: Build + acceptance script + regression

**Files:**
- Create: `scripts/acceptance/public-view-link.cjs`
- Modify: `docs/deployment/freeze.md`

**Step 1: Write failing acceptance script**

```js
// scripts/acceptance/public-view-link.cjs
const fn = require('../insforge-functions/vibeusage-public-view-issue');
```

**Step 2: Run acceptance script to verify failure**

Run: `node scripts/acceptance/public-view-link.cjs`
Expected: FAIL (missing function or behavior).

**Step 3: Build functions + finalize script**

Run: `npm run build:insforge`

**Step 4: Re-run acceptance script**

Run: `node scripts/acceptance/public-view-link.cjs`
Expected: PASS

**Step 5: Regression and freeze**

Run:
- `node --test test/public-view.test.js`
- `npm run build:insforge:check`

Update:
- `docs/deployment/freeze.md` with Public View entry + commands.

**Step 6: Commit**

```bash
git add scripts/acceptance/public-view-link.cjs docs/deployment/freeze.md
git commit -m "test: add public view acceptance and freeze record"
```
