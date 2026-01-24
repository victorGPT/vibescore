## 1. Baseline & Scope (Single Source of Truth)
- [ ] Confirm frontend inventory (all pages + `copy.jsx`)
- [ ] Freeze `copy.csv` and document as authoritative copy source
- [ ] Add `dashboard/src/mock/data.json` and define mock schema
- [ ] Wire `VITE_USE_MOCK=1` to force mock data for baselines
- [ ] Localize external assets (fonts/icons/images)
- [ ] Define baseline scenarios + routes (Landing, Dashboard, Share)
- [ ] Define baseline viewports (1440×900, 390×844)
- [ ] Freeze time/random/timezone; disable animations in baseline mode

## 2. Architecture (Simple)
- [ ] Convert frontend to TypeScript
- [ ] Create minimal directory structure per design
- [ ] Implement minimal Zustand stores (auth, ui only)
- [ ] Implement TanStack Query client + hooks (no manual cache)
- [ ] Keep Tailwind tokens and Matrix UI components unchanged (types only)

## 3. Cutover (One-Time)
- [ ] Build new entry points and routes with new architecture
- [ ] Remove legacy code at cutover (no dual path)

## 4. Verification
- [ ] Implement agent-browser baseline capture
- [ ] Store baselines in repo
- [ ] Enforce visual diff threshold (0.1%)
- [ ] Run baseline regression for all scenarios
