# Change: Auth Session Expiry Recovery (First-Principles)

## Why
当前 Dashboard 在 InsForge token 过期后会继续发起私有请求并维持“已登录”状态，导致反复 401、无明确引导。需要用可验证证据驱动 auth 状态，保证安全与可恢复性。

## What Changes
- Introduce auth status machine with explicit `signed_in / expired / signed_out` semantics.
- Treat 401 with JWT as authoritative expiry signal; only successful JWT responses clear expiry.
- When expired, block private requests and hide private data, while allowing a single revalidate probe using the latest token.
- Wire UI gating and session-expired banner to the new status machine.

## Impact
- Affected specs: `vibescore-tracker`
- Affected code: `dashboard/src/App.jsx`, `dashboard/src/pages/DashboardPage.jsx`, `dashboard/src/lib/vibescore-api.js`, tests
