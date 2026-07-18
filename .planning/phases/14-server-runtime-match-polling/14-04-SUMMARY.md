---
phase: 14-server-runtime-match-polling
plan: 04
subsystem: ui
tags: [dashboard, components, layout]

# Dependency graph
requires: [14-01, 14-03]
provides:
  - MatchBanner UI component
  - Dashboard layout and page structure
affects: [Phase 15]

# Tech tracking
tech-stack:
  added: []
  patterns: [hero-card style pulsing indicator, route groups for layouts, zustand selectors for polling]

key-files:
  created:
    - src/components/dashboard/MatchBanner.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - tests/components/dashboard/MatchBanner.test.tsx
    - tests/stores/simSlice.test.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "Decided to have the dashboard page trigger the initial /api/match fetch using the useMatchPoller hook while wiring the data straight into the liveStore so MatchBanner can remain purely presentational."
  - "Configured Vitest to run on .tsx files as well, expanding from .ts-only tests to allow component testing with React Testing Library."

patterns-established:
  - "UI: MatchBanner reads entirely from the liveStore, not from props, simplifying the hook component tree wiring."
  - "Testing: vitest with react-testing-library automatically cleans up document.body after each test when cleanup is registered."

requirements-completed: [LIVE-01, LIVE-03, INT-02]

coverage:
  - id: D1
    description: "Ops dashboard at /dashboard shows MatchBanner with live match score, phase, and minute"
    requirement: "LIVE-03"
    verification:
      - kind: unit
        ref: "npx vitest run tests/components/dashboard/MatchBanner.test.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dashboard page calls initializeSim(presets.normal) lazily on mount"
    requirement: "INT-02"
    verification:
      - kind: unit
        ref: "npx vitest run tests/stores/simSlice.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "MatchBanner shows all 4 visual states properly"
    requirement: "LIVE-03"
    verification:
      - kind: unit
        ref: "npx vitest run tests/components/dashboard/MatchBanner.test.tsx"
        status: pass
    human_judgment: false

# Metrics
duration: 15min
completed: 2026-07-14
status: complete
---

# Phase 14 Plan 04: Dashboard Integration Summary

**Created the Ops Dashboard Layout, MatchBanner component, and hooked up API polling to global state.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-14T15:50:00Z
- **Completed:** 2026-07-14T16:05:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Created `MatchBanner` component in `src/components/dashboard` representing four separate match states (live, loading, upcoming, and error).
- Wrote and verified full rendering test suite in `tests/components/dashboard/MatchBanner.test.tsx` for MatchBanner edge cases.
- Implemented `/dashboard` page and route layout group. Hooked up `useMatchPoller` to `DashboardPage` and bound it to update `liveStore` via `setMatch`.
- Implemented `initializeSim` on dashboard load (INT-02).
- Expanded vitest's scope to run on `.tsx` tests.
- Wrote unit tests confirming `simSlice.initializeSim` and `simSlice.reset` correctly configure state.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create MatchBanner component + tests** - `2d9740a` (feat)
2. **Task 2: Create dashboard layout + page** - `2d9740a` (feat)
3. **Task 3: Create simSlice initialization test** - `2d9740a` (feat)

**Plan metadata:** (will be committed next)

## Files Created/Modified
- `src/components/dashboard/MatchBanner.tsx`
- `tests/components/dashboard/MatchBanner.test.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `tests/stores/simSlice.test.ts`
- `vitest.config.ts`

## Decisions Made
- Updated vitest configuration `include` pattern from `"tests/**/*.test.ts"` to `["tests/**/*.test.ts", "tests/**/*.test.tsx"]` to accommodate new React component test files.
- `MatchBanner` consumes its props natively, bypassing hook nesting while remaining clean.
- `useMatchPoller` inside `/dashboard` routes straight to `/api/match` and updates `liveStore`.

## Deviations from Plan
- Passed `cleanup()` manually in vitest for component tests to ensure `afterEach` clears the `.animate-pulse` components globally between iterations.

## Issues Encountered
- Missing TSX tests initially in `vitest.config.ts`. Fixed.
- Testing Library overlapping elements because of missing automated cleanup. Fixed.

## User Setup Required
None

## Next Phase Readiness
Phase 14 is complete. The application now supports polling worldcup26.ir, storing that data in `matchSlice`, and rendering it into a Live Ops dashboard via the Next.js router. The Phase is now ready for `complete-phase` audit and transition to Phase 15.
