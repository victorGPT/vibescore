# Dashboard First Login Onboarding Design

## Goal
Provide a clear, low-friction first-login onboarding that explains the initial CLI data processing and upload latency, so users understand why data may not appear immediately. The onboarding should be simple, client-only, and avoid backend changes.

## Scope
**In**:
- A first-login modal in the Dashboard (遮罩 + 居中弹窗).
- LocalStorage-based “show once” control.
- Copy updates via `dashboard/src/content/copy.csv`.

**Out**:
- Backend status APIs or persistent account-level flags.
- CLI behavior changes beyond existing flow.
- Progress or polling logic in the frontend.

## UX Summary
- On first login to the Dashboard, show a blocking overlay modal with a concise 3-step explanation:
  1) Local CLI processes data (may take a few minutes).
  2) CLI uploads to backend for processing.
  3) Dashboard displays results when ready.
- Single primary action button (e.g., “I understand” / “Start using”).
- Modal is dismissed only via the button; no background interaction.
- Store a local flag (e.g., `vibeusage.dashboard.welcome.v1`) to prevent repeat display.

## Trigger Logic
- Render condition: user is signed in and localStorage flag is not set.
- On dismiss: set localStorage flag to prevent future display.
- If localStorage is cleared, modal will reappear (accepted trade-off for simplicity).

## Copy Requirements
- All visible text must live in `dashboard/src/content/copy.csv` and be referenced by key.
- Copy should:
  - Explain the two latency windows (local processing vs upload/processing).
  - Reassure the user this is expected.
  - Provide a simple next step (e.g., “Keep this tab open; data will appear soon”).

## UI Placement
- Overlay covers entire dashboard.
- Modal centered, visually prominent, consistent with Matrix-A style.
- Background dimmed with mask; no interaction with dashboard while visible.

## Failure/Edge Notes
- This design does not diagnose failures; it only clarifies expected delays.
- If uploads fail, existing dashboard messaging or CLI guidance remains the source of truth.

## Metrics (Optional)
- Track modal view and dismiss in analytics if a lightweight client-side tracker exists.

## Acceptance Criteria
- First login shows onboarding modal exactly once per browser profile.
- Dismiss button hides modal and persists flag.
- All copy uses copy registry keys (no hardcoded strings in components).
- Modal blocks dashboard interaction while visible.

## Next Steps
- Implement modal in Dashboard UI (likely `DashboardPage` or top-level layout).
- Add copy keys to `dashboard/src/content/copy.csv`.
- Add a simple test to ensure the modal renders when flag is absent and hides when set.
