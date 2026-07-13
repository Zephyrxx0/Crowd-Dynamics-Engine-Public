# Predictive Fan Flow Simulator → Smart Stadium Operations

## What This Is

A live GenAI-powered stadium operations system for FIFA World Cup 2026 — ingesting real match events, simulating crowd dynamics in real time, streaming AI safety alerts to ops teams, and simultaneously answering fan queries, all from a single simulation engine. Built on the existing pre-event crowd simulation engine, now coupled with live data feeds (match events, weather) and dual-mode AI (operations alerts + fan assistant).

## Core Value

Operations teams can monitor and respond to real-time crowd risks during a live match, receiving AI-generated safety alerts tied to actual game events, while fans get real-time navigation assistance through a stadium chatbot.

## Current Milestone: v2.0 Smart Stadium Operations

**Goal:** Upgrade from pre-event planning tool to live GenAI-powered stadium operations system — real match event coupling, AI alert streaming, fan-facing mode, weather integration.

**Target features:**
- Live match feed → simulation coupling (worldcup26.ir API)
- AI alert stream (Claude in the simulation loop, SSE)
- Fan-facing mode (/fan route, stadium chatbot)
- Weather layer (OpenWeatherMap integration)
- Demo-proof simulation (canned match sequence)
- Ops dashboard components (MatchBanner, AlertFeed, WeatherCard)

## Requirements

### Validated

<!-- Shipped and confirmed valuable during v1.0. -->

- ✓ CFG-01: Configure stadium capacity, gates, delays, and phase timing — *Phase 9*
- ✓ CFG-02: Apply preset scenarios (Normal, Sold Out, Gate Crisis) — *Phase 9*
- ✓ CFG-03: Tune advanced calibration controls — *Phase 9*
- ✓ SIM-01: Run deterministic multi-phase simulation — *Phase 1*
- ✓ SIM-02: Model gate-delay and throughput constraints — *Phase 1*
- ✓ VIZ-01: View D3 chart of zone density by phase — *Phase 9*
- ✓ VIZ-02: View zone heatmap with green/amber/red thresholds — *Phase 9*
- ✓ VIZ-03: Perceive simulation updates through animated transitions — *Phase 9*
- ✓ AI-01: Generate structured Gemini risk report from simulation JSON — *Phase 9*
- ✓ AI-02: Schema-validated report parsing — *Phase 9*
- ✓ AI-03: Deterministic fallback report on AI failure — *Phase 9*
- ✓ CMP-01: Run-adjust-rerun comparison workflow — *Phase 9*
- ✓ CMP-02: Intervention sensitivity narratives — *Phase 9*
- ✓ CMP-03: Persisted run-history analytics — *Phase 9*
- ✓ DEP-01: Public Cloud Run deployment URL — *Phase 9*
- ✓ DEP-02: Containerized Nginx static build — *Phase 9*
- ✓ DEP-03: Exportable report artifact — *Phase 9*
- ✓ UI-06-01: Cinematic hero interface — *Phase 10*
- ✓ UI-06-02: Magnetic dock navigation — *Phase 10*
- ✓ UI-06-03: Motion-enhanced, reduced-motion-aware interactions — *Phase 10*
- ✓ UI-06-04: Centralized theme tokens — *Phase 10*

### Active

<!-- Current scope for v2.0. Building toward these. -->

- [ ] **LIVE-01**: Simulation responds to live match events from worldcup26.ir via 30s polling
- [ ] **LIVE-02**: Match phase transitions (goal, half-time, full-time) trigger zone density deltas
- [ ] **LIVE-03**: Ops dashboard displays live match score, phase, and minute banner
- [ ] **AIAL-01**: Claude analyzes zone density data every 45s and streams ops alerts via SSE
- [ ] **AIAL-02**: Alerts are classified by severity (nominal, warning, critical) and displayed in live feed
- [ ] **FAN-01**: Fan-facing /fan route with chatbot answering stadium navigation questions
- [ ] **FAN-02**: Fan chatbot receives live zone context and match state for grounded answers
- [ ] **WTHR-01**: Weather data from OpenWeatherMap adjusts zone densities (rain/heat/stadium)
- [ ] **WTHR-02**: Ops dashboard shows current weather conditions with density impact notes
- [ ] **DEMO-01**: Canned match event sequence for demo when no live match is playing
- [ ] **INT-01**: useMatchPoller, useAlertStream, and useWeather hooks wired into ops dashboard
- [ ] **INT-02**: Simulation store initialized with existing zone data from the v1 engine
- [ ] **DEP-04**: Environment variables (ANTHROPIC_API_KEY, OWM_API_KEY) configured on deployment

### Out of Scope

- Real-time live sensor ingestion during events — this project focuses on pre-event simulation, not operational telemetry.
- Native mobile apps — web-first scope for hackathon timeline and delivery speed.
- Multi-tenant enterprise admin features — unnecessary for v1 judging criteria.
- 3D stadium model (Three.js/Cesium) — 3-5 days for visual payoff that doesn't address GenAI requirement.
- Transit/traffic APIs (TomTom, GTFS) — Brittle, rate-limited, hard to demo.

## Context

### v1.0 (Shipped)
The original Predictive Fan Flow Simulator shipped as a pre-event planning tool with:
- 12 phases covering deterministic simulation, scenario configuration, D3 visualization, Gemini AI risk reporting, comparison workflow, Cloud Run deployment, and UI overhaul
- 21 validated requirements — all checked complete
- Deployed to Google Cloud Run as a static Nginx build

### v2.0 (Current)
The upgrade from pre-event planning to live operations adds:
1. **Live match feed** — Poll worldcup26.ir every 30s, detect phase transitions (goal, half-time, etc.), apply zone density deltas
2. **AI alert stream** — Claude analyzes zone data every 45s, streams SSE alerts to ops dashboard
3. **Fan mode** — Separate /fan route with chatbot using live zone context
4. **Weather layer** — OpenWeatherMap integration adjusts densities for rain/heat/storm

Architecture principle: simulation state (`simulationStore`) is the single source of truth. Both ops AI and fan chatbot read from the same store.

## Constraints

- **Timeline**: About 13 days — hackathon window requires strict MVP-first sequencing.
- **Platform**: Google Cloud Run deployment — final demo must be publicly reachable as `*.run.app`.
- **Tooling**: Google Antigravity required — implementation should preserve prompt-driven build workflow.
- **Architecture**: No traditional backend service — simulation runs client-side, app served as static assets.
- **AI Integration**: Gemini key handling via build-time injection — avoid committing secrets and keep deployment repeatable.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use React + Vite + Tailwind + D3 | Fast build velocity plus expressive, custom visualization for simulation output | ✓ Good |
| Keep simulation client-side in `StadiumSim` | Removes backend complexity and speeds Cloud Run deployment | ✓ Good |
| Trigger one Gemini call per simulation run | Controls cost and keeps report generation deterministic | ✓ Good |
| Prioritize scenario presets (Normal, Sold Out, Gate Crisis) | Strengthens demo narrative and judge-facing clarity | ✓ Good |
| Deploy as static app on Cloud Run with Nginx | Meets platform requirement with minimal operational overhead | ✓ Good |
| Use Zustand for simulation store | Central state that both ops AI and fan chatbot read from | — Pending |
| Claude for both ops alerts and fan chat | Same model, different system prompts, same sim state | — Pending |
| SSE for AI streaming | Simpler than WebSockets, server-to-client streaming is the right fit | — Pending |
| Server-side proxy for third-party APIs | Never call worldcup26.ir or OWM from client | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -> still the right priority?
3. Audit Out of Scope -> reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-13 after v2.0 milestone start*
