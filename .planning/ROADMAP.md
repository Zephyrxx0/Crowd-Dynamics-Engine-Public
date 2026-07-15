# Roadmap: Predictive Fan Flow Simulator → Smart Stadium Operations

## Milestones

- ✅ **v1.0 MVP** - Phases 1-12 (shipped)
- 🚧 **v2.0 Smart Stadium Operations** - Phases 13-18 (planning)

---

## 🚧 v2.0 Smart Stadium Operations (In Progress)

**Milestone Goal:** Upgrade from pre-event planning tool to live GenAI-powered stadium operations system — real match event coupling, AI alert streaming, fan-facing mode, weather integration, demo-proof simulation.

**Phase numbering:** Continues from v1.0 (Phase 12), starts at Phase 13.

---

## Phases

- [ ] **Phase 13: Foundation & Architecture Decision** - Resolve Express vs Next.js, define store architecture, create type definitions
- [ ] **Phase 14: Server Runtime + Match Polling** - Server runtime running, match polling, match banner on dashboard
- [ ] **Phase 15: AI Alert Stream** - Claude analyzes zone data, streams SSE alerts to ops dashboard
- [ ] **Phase 16: Fan Chatbot** - Fan-facing /fan route with stadium chatbot
- [ ] **Phase 17: Weather Integration** - OpenWeatherMap proxy, density adjustments, weather card
- [ ] **Phase 18: Demo Mode + Integration Wiring** - Canned events, full integration, deployment finalization

## Phase Details

### Phase 13: Foundation & Architecture Decision

**Goal**: Resolve Express vs Next.js architecture decision, define store splitting strategy, create shared type definitions, scaffold server runtime path
**Depends on**: Nothing (first v2.0 phase)
**Requirements**: None (foundation decision — no user-facing requirement)
**Success Criteria** (what must be TRUE):

  1. Architecture decision (Express vs Next.js) documented in PROJECT.md Key Decisions with rationale
  2. Shared TypeScript type definitions exist in per-domain `src/types/*.ts` files with Zod schemas and barrel export
  3. Zustand store splitting strategy defined with sub-store slices (sim/match/weather/alert/chat) composed via createStore + StateCreator
  4. Server runtime scaffolded with API route handler skeleton and updated Dockerfile

**Plans**: 3 plans
Plans:

- [x] 13-01-PLAN.md — Type definitions (Zod schemas) + build config (standalone, Docker, scripts)
- [x] 13-02-PLAN.md — Zustand store architecture (5 slices + combined store)
- [x] 13-03-PLAN.md — API route skeletons + PROJECT.md decision documentation

### Phase 14: Server Runtime + Match Polling

**Goal**: Server runtime running in production mode, match polling delivering live data to simulation store, match banner visible on ops dashboard
**Depends on**: Phase 13
**Requirements**: LIVE-01, LIVE-03, INT-02, DEP-04
**Success Criteria** (what must be TRUE):

   1. Ops dashboard displays live match score, phase, and minute in a MatchBanner component
   2. Match data from worldcup26.ir is fetched every 30s via `/api/match` proxy and updates simulation state
   3. Simulation store (`simulationStore`) initializes with existing zone data from v1 engine
   4. Application serves from the new server runtime (Express or Next.js) with environment variables configured

**Plans**: 4 plans

Plans:

- [x] 14-01-PLAN.md — Data mapping layer: Zod schemas, types, mapping functions, live match heuristic
- [x] 14-02-PLAN.md — /api/match proxy: server-side route handler with Zod validation + error handling
- [x] 14-03-PLAN.md — useMatchPoller hook: polling with exponential backoff retry + Page Visibility pause
- [x] 14-04-PLAN.md — MatchBanner + dashboard layout: hero card, route group, sim init wiring

### Phase 15: AI Alert Stream

**Goal**: Claude analyzes zone density data every 45s and streams ops alerts via SSE, displayed in a severity-coded live feed on the dashboard
**Depends on**: Phase 14 (requires match data + populated simulation store)
**Requirements**: AIAL-01, AIAL-02
**Success Criteria** (what must be TRUE):

   1. Ops dashboard displays live AI alerts categorized by severity (nominal, warning, critical) in an AlertFeed component
   2. Alert feed updates automatically as new alerts arrive via SSE, with auto-scroll to latest
   3. Alerts are visually distinct by severity level (color, icon, urgency treatment)
   4. AbortController cancels alert generation on component unmount or page navigation

**Plans**: 3 plans

Plans:

- [x] 15-01-PLAN.md — Server-Side Alert Pipeline (Gemini utility, prompt builder, SSE route handler)
- [x] 15-02-PLAN.md — Client-Side Alert Infrastructure (alertSlice FIFO, useAlertStream hook, AlertFeed component)
- [ ] 15-03-PLAN.md — Dashboard Integration + Eval Setup (wire into dashboard, promptfoo config, env vars)

**UI hint**: yes

### Phase 16: Fan Chatbot

**Goal**: Fan-facing `/fan` route with chatbot that answers stadium navigation questions grounded in live zone context and match state
**Depends on**: Phase 14 (requires simulation store with zone data and match state)
**Requirements**: FAN-01, FAN-02
**Success Criteria** (what must be TRUE):

  1. Fan can navigate to `/fan` route and see a chatbot interface with message input
  2. Fan can ask stadium navigation questions and receive contextually grounded answers that reflect live zone density and match state
  3. Chatbot responses stream in as they're generated (SSE) with buffered rendering
  4. Conversation history is maintained within session (capped at 10 messages)
   5. Quick question chips are available for one-tap demo queries

<<<<<<< Updated upstream
**Plans**: TBD
**UI hint**: yes
=======
**Plans**: 4 plansPlans:
**Wave 1**

- [x] 16-01-PLAN.md — Foundation: types, store (FIFO-10), prompt builder

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 16-02-PLAN.md — Server: POST /api/chat SSE route handler
- [x] 16-03-PLAN.md — Client: useChatStream hook + input components

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 16-04-PLAN.md — UI: ChatMessage, ChatInterface, fan layout + page

>>>>>>> Stashed changes

### Phase 17: Weather Integration

**Goal**: Weather data from OpenWeatherMap adjusts zone densities (rain/heat/stadium effects) and weather card is displayed on ops dashboard
**Depends on**: Phase 14 (requires server runtime + simulation store)
**Requirements**: WTHR-01, WTHR-02
**Success Criteria** (what must be TRUE):

  1. Ops dashboard shows a WeatherCard with current weather conditions (temperature, conditions, icon)
  2. Zone densities adjust based on weather factors (rain accelerates egress, heat reduces capacity) as an overlay on planned density
   3. Weather data refreshes automatically at appropriate intervals (10min) without manual reload

**Plans**: 3 plansPlans:
**Wave 1**

- [x] 17-01-PLAN.md — OWM API proxy, weather mapping utility, test suite
- [x] 17-02-PLAN.md — useWeather hook (10-min polling, impact change detection), weatherSlice extension

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 17-03-PLAN.md — WeatherCard component (5 states), dashboard layout integration, impact-triggered re-sim

**UI hint**: yes

### Phase 18: Demo Mode + Integration Wiring

**Goal**: Complete integration of all live hooks into ops dashboard, demo mode with canned match events, phase transition density deltas, and deployment finalization
**Depends on**: Phase 15, Phase 16, Phase 17 (all live features must exist before integration)
**Requirements**: LIVE-02, DEMO-01, INT-01
**Success Criteria** (what must be TRUE):

  1. Canned match event sequence plays back in demo mode when no live match is playing, covering full match lifecycle (kickoff, goal, halftime, second half, full-time)
  2. Match phase transitions (goal, half-time, full-time) trigger calibrated zone density deltas visible in the simulation
  3. All live hooks (useMatchPoller, useAlertStream, useWeather) fully wired into ops dashboard components
  4. Demo/live toggle works with complete state reset and visual "DEMO MODE" indicator
  5. All components accessible through MagneticDock navigation tabs

**Plans**: TBD
**UI hint**: yes

---

<details>
<summary>✅ v1.0 MVP (Phases 1-12) - SHIPPED</summary>

### Phase 1: Deterministic Simulation Core

**Goal**: Build the core computation engine handling continuous, deterministic state transitions for simulation.
**Plans**: 2 plans

- [x] 01-01
- [x] 01-02

### Phase 2: Scenario Configuration Experience

**Goal**: Establish the structure for configuring comparison scenarios using modular overrides against a baseline.
**Plans**: 3 plans

- [x] 02-01
- [x] 02-02
- [x] 02-03

### Phase 3: Decision-Grade Risk Visualization

**Goal**: Visualize core metric trajectories (Cash, Debt, Valuation) with confidence banding and direct scenario comparison.
**Plans**: 3 plans

- [x] 03-01
- [x] 03-02
- [x] 03-03

### Phase 4: Structured AI Risk Reporting

**Goal**: Integrate AI to generate structured, deterministic narrative reports explaining deviations between scenarios.
**Plans**: 3 plans

- [x] 04-01
- [x] 04-02
- [x] 04-03

### Phase 5: Comparison Workflow and Cloud Run Delivery

**Goal**: Finalize the multi-scenario comparison flow (up to 3 scenarios) and package the application for Cloud Run deployment.
**Plans**: 3 plans

- [x] 05-01
- [x] 05-02
- [x] 05-03

### Phase 6: Website Overhaul with Next.js and Motion-First UI

**Goal**: Replace existing static site with a responsive, motion-enhanced React/Next.js application matching the provided design.
**Plans**: 5 plans

- [x] 06-01
- [x] 06-02
- [x] 06-03
- [x] 06-04
- [x] 06-05

### Phase 7: Planning Traceability Reconciliation

**Goal**: Standardize and complete planning artifacts to establish continuous traceability from ROADMAP to code implementation.
**Plans**: 1 plan

- [x] 07-01

### Phase 8: Milestone Audit Refresh and Roadmap Consistency

**Goal**: Ensure all roadmap statuses, task verifications, and milestone tracking are fully up-to-date and consistent with executed phases.
**Plans**: 1 plan

- [x] 08-01

### Phase 9: Verification Evidence Backfill (Product Phases 02-05)

**Goal**: Retroactively establish explicit test/verification evidence linking plan criteria directly to codebase reality for earlier phases.
**Plans**: 3 plans

- [x] 09-01
- [x] 09-02
- [x] 09-03

### Phase 10: Verification Evidence Backfill (UI and Governance Phases 06-08)

**Goal**: Retroactively verify plan criteria against the codebase for recent UI architecture and planning governance phases.
**Plans**: 2 plans

- [x] 10-01
- [x] 10-02

### Phase 11: Integration Matrix Revalidation and Milestone Readiness

**Goal**: Execute comprehensive cross-phase checks mapping Phase 01-10 artifacts to ensure the system behaves consistently as a unified product.
**Plans**: 1 plan

- [x] 11-01

### Phase 12: Webpage Design Rehaul

**Goal**: Rehaul the webpage design into a polished, modern, multi-page application featuring 3D visuals.
**Depends on**: Phase 11
**Success Criteria** (what must be TRUE):

  1. The app runs on Next.js + Vite and is deployed to Cloud Run.
  2. A 3D visual (like a stadium) is implemented using Three.js and forms the main focus of the UI.
  3. The app is multi-page and uses shadcn components with clean CSS (shadcnthemer format).

**Plans**: 3 plans

- [x] 12-01: Migrate configuration to Next.js and Tailwind baseline
- [x] 12-02: Implement the CTA Hero Card and 21st-dev Magic MCP integration
- [x] 12-03: Implement the core 3D visual using Three.js / React Three Fiber

</details>

## Progress

**Execution Order:**
v2.0 phases execute in numeric order: 13 → 14 → 15 → 16 → 17 → 18

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Deterministic Simulation Core | v1.0 | 2/2 | Complete | 2026-04-18 |
| 2. Scenario Configuration Experience | v1.0 | 3/3 | Complete | 2026-04-19 |
| 3. Decision-Grade Risk Visualization | v1.0 | 3/3 | Complete | 2026-04-19 |
| 4. Structured AI Risk Reporting | v1.0 | 3/3 | Complete | 2026-04-20 |
| 5. Comparison Workflow and Cloud Run Delivery | v1.0 | 3/3 | Complete | 2026-04-20 |
| 6. Website Overhaul with Next.js and Motion-First UI | v1.0 | 5/5 | Complete | 2026-04-19 |
| 7. Planning Traceability Reconciliation | v1.0 | 1/1 | Complete | 2026-04-20 |
| 8. Milestone Audit Refresh and Roadmap Consistency | v1.0 | 1/1 | Complete | 2026-04-20 |
| 9. Verification Evidence Backfill (Product Phases 02-05) | v1.0 | 3/3 | Complete | 2026-04-20 |
| 10. Verification Evidence Backfill (UI and Governance Phases 06-08) | v1.0 | 2/2 | Complete | 2026-04-20 |
| 11. Integration Matrix Revalidation and Milestone Readiness | v1.0 | 1/1 | Complete | 2026-04-20 |
| 12. Webpage Design Rehaul | v1.0 | 3/3 | Complete | 2026-04-20 |
| 13. Foundation & Architecture Decision | v2.0 | 3/3 | Complete   | 2026-07-13 |
| 14. Server Runtime + Match Polling | v2.0 | 4/4 | Complete   | 2026-07-14 |
| 15. AI Alert Stream | v2.0 | 2/3 | In Progress|  |
<<<<<<< Updated upstream
| 16. Fan Chatbot | v2.0 | 0/0 | Not started | - |
=======
| 16. Fan Chatbot | v2.0 | 4/4 | Complete   | 2026-07-15 |
>>>>>>> Stashed changes
| 17. Weather Integration | v2.0 | 3/3 | Complete   | 2026-07-15 |
| 18. Demo Mode + Integration Wiring | v2.0 | 0/0 | Not started | - |
