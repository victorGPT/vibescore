# Usage Rolling Metrics + Test Framework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add rolling usage metrics to the summary API + dashboard UI, and add Vitest + RTL with a minimal interactive component test.

**Architecture:** Extend the usage summary endpoint with an opt-in `rolling=1` payload, plumb the rolling data through the dashboard data hook, and render a new `RollingUsagePanel` in the dashboard. Add Vitest config + setup files and a minimal MatrixButton interaction test.

**Tech Stack:** Node 20, InsForge Edge Functions, React 18 + Vite, Tailwind, Vitest, React Testing Library.

---

### Task 1: Add frontend test framework dependencies + config (config-only)

**Files:**
- Modify: `dashboard/package.json`
- Create: `dashboard/vitest.config.ts`

**Step 1: Add scripts + devDependencies**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@testing-library/react": "^14.3.1",
    "@testing-library/jest-dom": "^6.4.5",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^24.0.0"
  }
}
```

**Step 2: Create Vitest config**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
    include: ["src/**/*.test.{js,jsx,ts,tsx}"],
    globals: true,
  },
});
```

**Step 3: Install deps**

Run: `npm --prefix dashboard install`
Expected: deps installed, no errors.

**Step 4: Commit**

```bash
git add dashboard/package.json dashboard/package-lock.json dashboard/vitest.config.ts

git commit -m "test: add vitest configuration"
```

---

### Task 2: Add test setup + minimal interactive component test (TDD)

**Files:**
- Create: `dashboard/src/test/setupTests.ts`
- Create: `dashboard/src/test/test-utils.tsx`
- Create: `dashboard/src/ui/foundation/__tests__/MatrixButton.test.jsx`

**Step 1: Write failing MatrixButton test**

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatrixButton } from "../MatrixButton.jsx";

it("invokes onClick when activated", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(<MatrixButton onClick={onClick}>Run</MatrixButton>);

  await user.click(screen.getByRole("button", { name: "Run" }));

  expect(onClick).toHaveBeenCalledTimes(1);
});

it("respects disabled state", async () => {
  const onClick = vi.fn();
  const user = userEvent.setup();
  render(
    <MatrixButton onClick={onClick} disabled>
      Run
    </MatrixButton>
  );

  const button = screen.getByRole("button", { name: "Run" });
  expect(button).toBeDisabled();
  await user.click(button);
  expect(onClick).not.toHaveBeenCalled();
});
```

**Step 2: Run test to verify RED**

Run: `npm --prefix dashboard run test -- MatrixButton`
Expected: FAIL (missing setup or matcher errors).

**Step 3: Add test setup + utilities**

`dashboard/src/test/setupTests.ts`
```ts
import "@testing-library/jest-dom/vitest";
```

`dashboard/src/test/test-utils.tsx`
```tsx
import { render } from "@testing-library/react";

export { render };
```

**Step 4: Run test to verify GREEN**

Run: `npm --prefix dashboard run test -- MatrixButton`
Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/test/setupTests.ts dashboard/src/test/test-utils.tsx \
  dashboard/src/ui/foundation/__tests__/MatrixButton.test.jsx

git commit -m "test: add matrix button interaction test"
```

---

### Task 3: Add API test for rolling summary (TDD)

**Files:**
- Modify: `test/edge-functions.test.js`

**Step 1: Write failing test**

```js
test('vibeusage-usage-summary returns rolling metrics when requested', () =>
  withRollupDisabled(async () => {
    const fn = require('../insforge-functions/vibeusage-usage-summary');

    const userId = '99999999-9999-9999-9999-999999999999';
    const userJwt = 'user_jwt_test';

    const rows = [
      {
        hour_start: '2025-12-21T00:00:00.000Z',
        source: 'codex',
        model: 'gpt-4o',
        total_tokens: '10',
        input_tokens: '4',
        cached_input_tokens: '1',
        output_tokens: '3',
        reasoning_output_tokens: '2'
      }
    ];

    globalThis.createClient = (args) => {
      if (args && args.edgeFunctionToken === userJwt) {
        return {
          auth: {
            getCurrentUser: async () => ({ data: { user: { id: userId } }, error: null })
          },
          database: {
            from: (table) => {
              if (table === 'vibeusage_tracker_hourly') {
                const query = createQueryMock({ rows });
                return { select: () => query };
              }
              if (table === 'vibeusage_model_aliases') {
                return createQueryMock({ rows: [] });
              }
              if (table === 'vibeusage_pricing_profiles') {
                return createQueryMock({ rows: [] });
              }
              if (table === 'vibeusage_pricing_model_aliases') {
                return createQueryMock({ rows: [] });
              }
              throw new Error(`Unexpected table ${table}`);
            }
          }
        };
      }
      throw new Error(`Unexpected createClient args: ${JSON.stringify(args)}`);
    };

    const req = new Request(
      'http://localhost/functions/vibeusage-usage-summary?from=2025-12-21&to=2025-12-21&rolling=1',
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${userJwt}` }
      }
    );

    const res = await fn(req);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.rolling);
    assert.ok(body.rolling.last_7d);
    assert.ok(body.rolling.last_30d);
    assert.equal(body.rolling.last_7d.active_days, 1);
  }));
```

**Step 2: Run test to verify RED**

Run: `node --test test/edge-functions.test.js -t rolling`
Expected: FAIL (rolling missing).

**Step 3: Commit**

```bash
git add test/edge-functions.test.js

git commit -m "test: add rolling usage summary expectation"
```

---

### Task 4: Implement rolling metrics in usage summary API

**Files:**
- Modify: `insforge-src/functions/vibeusage-usage-summary.js`
- Modify: `insforge-functions/vibeusage-usage-summary.js` (via build)

**Step 1: Implement rolling calculation (minimal)**
- Add `rolling=1` query param support.
- Compute rolling ranges based on existing timezone context.
- Aggregate totals + active days.
- Compute `avg_per_active_day` with bigint division.

**Step 2: Run API test to verify GREEN**

Run: `node --test test/edge-functions.test.js -t rolling`
Expected: PASS.

**Step 3: Build edge functions**

Run: `npm run build:insforge`
Expected: build succeeds.

**Step 4: Commit**

```bash
git add insforge-src/functions/vibeusage-usage-summary.js insforge-functions/vibeusage-usage-summary.js

git commit -m "feat: add rolling metrics to usage summary"
```

---

### Task 5: Plumb rolling data through dashboard data layer

**Files:**
- Modify: `dashboard/src/lib/vibeusage-api.ts`
- Modify: `dashboard/src/hooks/use-usage-data.ts`
- Modify: `dashboard/src/lib/mock-data.ts`

**Step 1: Add `rolling=1` param to usage summary request**

**Step 2: Store rolling payload in hook return**

**Step 3: Update mock summary to include rolling fields**

**Step 4: Run unit test to confirm no regressions**

Run: `npm --prefix dashboard run test -- MatrixButton`
Expected: PASS.

**Step 5: Commit**

```bash
git add dashboard/src/lib/vibeusage-api.ts dashboard/src/hooks/use-usage-data.ts dashboard/src/lib/mock-data.ts

git commit -m "feat: expose rolling usage summary data"
```

---

### Task 6: Add RollingUsagePanel UI + copy registry

**Files:**
- Create: `dashboard/src/ui/matrix-a/components/RollingUsagePanel.jsx`
- Modify: `dashboard/src/pages/DashboardPage.jsx`
- Modify: `dashboard/src/ui/matrix-a/views/DashboardView.jsx`
- Modify: `dashboard/src/content/copy.csv`

**Step 1: Add copy keys**

**Step 2: Create RollingUsagePanel component**

**Step 3: Wire into DashboardPage + DashboardView**

**Step 4: Add component test (optional but preferred)**
- `dashboard/src/ui/matrix-a/components/__tests__/RollingUsagePanel.test.jsx`

**Step 5: Run validations**

Run: `npm run validate:copy`
Expected: PASS.

Run: `npm run validate:ui-hardcode`
Expected: PASS.

Run: `rg -n "#[0-9a-fA-F]{3,6}|rgba?\\(" dashboard/src`
Expected: No matches (or explain exceptions).

**Step 6: Commit**

```bash
git add dashboard/src/ui/matrix-a/components/RollingUsagePanel.jsx \
  dashboard/src/ui/matrix-a/views/DashboardView.jsx \
  dashboard/src/pages/DashboardPage.jsx \
  dashboard/src/content/copy.csv

git commit -m "feat: add rolling usage panel"
```

---

### Task 7: Post-implementation canvas sync

**Files:**
- Modify: `architecture.canvas`

**Step 1: Re-run canvas generator**

Run: `node scripts/ops/architecture-canvas.cjs`
Expected: canvas regenerated.

**Step 2: Update status to Implemented for touched nodes**

**Step 3: Commit**

```bash
git add architecture.canvas

git commit -m "chore: sync architecture canvas"
```

---

### Final Verification

Run:
- `npm test`
- `npm --prefix dashboard run test`
- `npm run validate:copy`
- `npm run validate:ui-hardcode`
- `npm run build:insforge`

Expected: All commands pass.
