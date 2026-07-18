---
phase: 19-audit-remediation-and-codebase-hardening
plan: 02
subsystem: code-quality-security
tags: [react, zustand, nextjs, gemini, code-quality, security]

requires:
  - phase: 19-01
    provides: "makeValidatedStorage factory and server-side AI route patterns"
provides:
  - "Stable alert stream reconnection using matchRef"
  - "Direct simulateDeterministic usage with StadiumSim adapter removed"
  - "Decoupled scenario/comparison store orchestration"
  - "Typed phase transition delta handling"
  - "Server-side /api/report route for Gemini risk reports"
affects: [19-03, security-remediation, reporting, simulation, visualization]

tech-stack:
  added: []
  patterns:
    - "useRef-backed callback stability for polling/SSE hooks"
    - "Validated Zustand persistence through makeValidatedStorage"
    - "Server-only Gemini calls behind Next.js route handlers"

key-files:
  created:
    - src/app/api/report/route.ts
  modified:
    - src/hooks/useAlertStream.ts
    - src/hooks/useScenarioStore.ts
    - src/hooks/useComparisonStore.ts
    - src/components/config/ScenarioForm.tsx
    - src/visualization/components/VisualizationWorkspace.tsx
    - src/hooks/usePhaseTransitionWatcher.ts
    - src/lib/api/phaseTransitions.ts
    - src/reporting/gemini/generateRiskReport.ts
    - src/simulation/index.ts
  deleted:
    - src/simulation/adapters/StadiumSim.ts

key-decisions:
  - "Kept invokeGeminiViaFetch for the explicit invokeModel compatibility path; default report generation now calls /api/report."
  - "Updated VisualizationWorkspace consumers because removing the activeTab prop required call-site cleanup for TypeScript correctness."
  - "Regenerated Next route types with npx next typegen after adding /api/report."

patterns-established:
  - "Store actions stay local; cross-store orchestration belongs at UI/action boundaries."
  - "No-op phase transition events return the original SimulationInput reference."
  - "AI report generation defaults to a server route instead of browser-side Gemini fetch."

requirements-completed: [CODEQ-01, SEC-01]

coverage:
  - id: D1
    description: "useAlertStream no longer reconnects when 30s match polling updates match state"
    requirement: "CODEQ-01"
    verification:
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: other
        ref: "rg matchRef src/hooks/useAlertStream.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "StadiumSim adapter removed and call sites use simulateDeterministic directly"
    requirement: "CODEQ-01"
    verification:
      - kind: unit
        ref: "tests/simulation/contracts.test.ts#exports simulateDeterministic directly from the simulation barrel"
        status: pass
      - kind: automated_ui
        ref: "tests/ui/run.test.ts#runs deterministic simulation when form input is valid"
        status: pass
    human_judgment: false
  - id: D3
    description: "Scenario/comparison stores use makeValidatedStorage and scenario output setting is decoupled"
    requirement: "CODEQ-01"
    verification:
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: other
        ref: "rg makeValidatedStorage src/hooks/useScenarioStore.ts src/hooks/useComparisonStore.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Phase transition handling uses resolvePhaseEvent and typed spread-based deltas"
    requirement: "CODEQ-01"
    verification:
      - kind: unit
        ref: "tests/lib/api/phaseTransitions.test.ts"
        status: pass
      - kind: unit
        ref: "tests/hooks/usePhaseTransitionWatcher.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "/api/report validates SimulationOutput, rate-limits, calls Gemini server-side, and generateRiskReport uses it by default"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "tests/ui/reporting/generateRiskReport.test.ts"
        status: pass
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
    human_judgment: false
  - id: D6
    description: "VisualizationWorkspace renders only simulation telemetry and no longer accepts activeTab"
    requirement: "CODEQ-01"
    verification:
      - kind: other
        ref: "npx tsc --noEmit"
        status: pass
      - kind: other
        ref: "rg activeTab src/visualization/components/VisualizationWorkspace.tsx"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-07-18
status: complete
---

# Phase 19 Plan 02: Code Quality Remediation Summary

**Alert streaming, simulation orchestration, phase transitions, and risk reporting now use leaner server-safe code paths.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-07-18T18:36:00Z
- **Completed:** 2026-07-18T19:16:44Z
- **Tasks:** 4
- **Files modified:** 18

## Accomplishments

- Fixed `useAlertStream` reconnect storms by moving live match data into `matchRef` while keeping `connect` stable.
- Removed the zero-value `StadiumSim` adapter and updated all production/test references to `simulateDeterministic`.
- Removed `VisualizationWorkspace` compare/report dead branches and cleaned up call sites that passed `activeTab`.
- Decoupled `useScenarioStore` from `useComparisonStore`, with orchestration now explicit in `ScenarioForm.onValidInput`.
- Replaced duplicate persisted storage parsing with `makeValidatedStorage` in both scenario and comparison stores.
- Extracted typed phase event resolution and replaced deep-clone transition deltas with spread-based immutable returns.
- Added `/api/report` with rate limiting, Zod validation, server-side Gemini streaming, and default client calls through the route.

## Task Commits

Each production task was committed atomically where the tree could remain buildable:

1. **Task 2.1: Fix useAlertStream reconnection bug** - `586b800` (fix)
2. **Tasks 2.2/2.3: Remove StadiumSim, clean visualization branches, decouple stores, adopt storage factory** - `0faa145` (refactor)
3. **Task 2.4: Extract phase events, type transition deltas, add /api/report** - `b83b62d` (feat)

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/app/api/report/route.ts` - New risk report POST route with rate limiting, SimulationOutput validation, and server-side Gemini call.
- `src/hooks/useAlertStream.ts` - Uses `matchRef` and stable `connect` dependencies.
- `src/hooks/useScenarioStore.ts` - Plain `setLatestSimulationOutput`, direct simulator calls, and `makeValidatedStorage`.
- `src/hooks/useComparisonStore.ts` - Uses `makeValidatedStorage` for persisted comparison state.
- `src/components/config/ScenarioForm.tsx` - Runs `simulateDeterministic` directly and appends comparison runs explicitly.
- `src/visualization/components/VisualizationWorkspace.tsx` - Removes `activeTab` prop and compare/report branches.
- `src/hooks/usePhaseTransitionWatcher.ts` - Uses extracted `resolvePhaseEvent` and updates previous phase before guard.
- `src/lib/api/phaseTransitions.ts` - Exports `TransitionEvent` and uses spread-based immutable updates.
- `src/reporting/gemini/generateRiskReport.ts` - Defaults to calling `/api/report` while preserving `invokeModel` parsing.
- `src/simulation/index.ts` - Removes `StadiumSim` export.
- `src/simulation/adapters/StadiumSim.ts` - Deleted adapter wrapper.
- `tests/*` - Updated affected tests for direct simulator exports, typed callbacks, and new transition no-op semantics.

## Decisions Made

- Kept `invokeGeminiViaFetch` in place because the plan explicitly deferred client key removal/deletion to Wave 3.
- Updated `AppLayout` and `src/app/simulate/page.tsx` even though they were not in `files_modified`, because removing `VisualizationWorkspace.activeTab` required consumer cleanup.
- Regenerated generated Next route types with `npx next typegen` so `npx tsc --noEmit` reflects the new `/api/report` route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Scope boundary] VisualizationWorkspace consumer cleanup**
- **Found during:** Task 2.2
- **Issue:** Removing `activeTab` from `VisualizationWorkspace` left TypeScript-invalid prop usage in route/layout consumers.
- **Fix:** Removed `activeTab` props in `src/components/layout/AppLayout.tsx` and `src/app/simulate/page.tsx`.
- **Files modified:** `src/components/layout/AppLayout.tsx`, `src/app/simulate/page.tsx`
- **Verification:** `npx tsc --noEmit`
- **Committed in:** `0faa145`

**2. [Verification support] Tests referenced deleted adapter and old transition semantics**
- **Found during:** Verification
- **Issue:** Tests still imported `StadiumSim`, had a callback type mismatch, and expected no-op transitions to clone.
- **Fix:** Updated tests to use direct simulator exports, correct callback signatures, and the required no-op reference return.
- **Files modified:** `tests/simulation/contracts.test.ts`, `tests/ui/run.test.ts`, `tests/hooks/usePhaseTransitionWatcher.test.ts`, `tests/lib/api/phaseTransitions.test.ts`, `tests/lib/ai/buildAlertPrompt.test.ts`
- **Verification:** Targeted Vitest suite passed.
- **Committed in:** `0faa145`, `b83b62d`

---

**Total deviations:** 2 auto-fixed
**Impact on plan:** No scope creep; both were necessary to keep the plan’s source changes type-safe and verified.

## Issues Encountered

- `npx tsc --noEmit` initially failed on stale `.next/dev/types/validator.ts` route metadata after adding `/api/report`; `npx next typegen` regenerated route types and the required TypeScript check passed.
- `gsd-tools requirements.mark-complete CODEQ-01 SEC-01` reported both IDs are not present in `.planning/REQUIREMENTS.md`; no REQUIREMENTS file change was made.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `19-03`: `/api/report` exists as the server-side boundary needed before removing client-exposed Gemini environment variables.

## Verification

- `npx next typegen` — passed
- `npx tsc --noEmit` — passed
- `npx vitest run tests/lib/api/phaseTransitions.test.ts tests/hooks/usePhaseTransitionWatcher.test.ts tests/ui/run.test.ts tests/simulation/contracts.test.ts tests/ui/reporting/generateRiskReport.test.ts --reporter=verbose` — 5 files passed, 25 tests passed
- Acceptance grep checks — passed for `matchRef`, no `StadiumSim` refs, `makeValidatedStorage`, no `VisualizationWorkspace` activeTab/dead branch refs, `TransitionEvent`, `/api/report`, `rateLimit`, and `fetch("/api/report")`

## Self-Check: PASSED

- Key created file exists: `src/app/api/report/route.ts`
- Production task commits exist for `19-02`: `586b800`, `0faa145`, `b83b62d`
- Required verification commands passed after fixes.
- PLAN requirements copied into frontmatter: `CODEQ-01`, `SEC-01`

---
*Phase: 19-audit-remediation-and-codebase-hardening*
*Completed: 2026-07-18*
