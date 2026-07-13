# Requirements: Smart Stadium Operations

**Defined:** 2026-07-13
**Core Value:** Operations teams can monitor and respond to real-time crowd risks during a live match, receiving AI-generated safety alerts tied to actual game events, while fans get real-time navigation assistance through a stadium chatbot.

## v1 Requirements (Shipped)

All v1 requirements validated and complete. See `.planning/PROJECT.md` for full list.

## v2 Requirements

### Live Match Feed

- [ ] **LIVE-01**: Simulation responds to live match events from worldcup26.ir via 30s polling
- [ ] **LIVE-02**: Match phase transitions (goal, half-time, full-time) trigger calibrated zone density deltas
- [ ] **LIVE-03**: Ops dashboard displays live match score, phase, and minute banner

### AI Alert Stream

- [ ] **AIAL-01**: Claude analyzes zone density data every 45s and streams ops alerts via SSE
- [ ] **AIAL-02**: Alerts classified by severity (nominal, warning, critical) with visual treatment in live feed

### Fan Chatbot

- [ ] **FAN-01**: Fan-facing /fan route with chatbot answering stadium navigation questions
- [ ] **FAN-02**: Fan chatbot grounded in live zone context and match state for grounded, helpful answers

### Weather Integration

- [ ] **WTHR-01**: Weather data from OpenWeatherMap adjusts zone densities (rain/heat/stadium)
- [ ] **WTHR-02**: Ops dashboard shows current weather conditions with density impact notes

### Demo Mode

- [ ] **DEMO-01**: Canned match event sequence for demo when no live match is playing

### Integration & Deployment

- [ ] **INT-01**: useMatchPoller, useAlertStream, and useWeather hooks wired into ops dashboard
- [ ] **INT-02**: Simulation store initialized with existing zone data from the v1 engine
- [ ] **DEP-04**: Environment variables (ANTHROPIC_API_KEY, OWM_API_KEY) configured on deployment

## v3 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhancements

- **AIAL-03**: Alert trend direction ("Zone A trending up 8%/min") with recommended actions
- **FAN-03**: Multi-turn conversation context with session-level memory
- **FAN-04**: Fan chatbot push notifications (wait-time alerts)
- **DEMO-02**: Demo mode speed controls (1x/2x/5x playback)
- **WTHR-03**: Historical weather impact dashboard
- **INT-03**: Multi-provider AI fallback cascade

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time CCTV/video analytics | Contradicts no-traditional-backend architecture; simulation IS the sensor |
| Multi-provider AI fallback | Rule-based deterministic fallback is sufficient and simpler |
| Full digital twin / particle physics | Zone-level model is sufficient for safety decisions; particle sim adds 3-5x complexity |
| Fan authentication / user profiles | Adds auth infrastructure that splits demo focus from core features |
| Push notifications to fans | Requires service worker / PWA infrastructure; fan chatbot is pull-based |
| Live transit / traffic APIs | Brittle, rate-limited, zero value to operations safety story |
| Historical trend dashboards | Requires data persistence beyond static SPA architecture |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LIVE-01 | Phase 14 | Pending |
| LIVE-02 | Phase 18 | Pending |
| LIVE-03 | Phase 14 | Pending |
| AIAL-01 | Phase 15 | Pending |
| AIAL-02 | Phase 15 | Pending |
| FAN-01 | Phase 16 | Pending |
| FAN-02 | Phase 16 | Pending |
| WTHR-01 | Phase 17 | Pending |
| WTHR-02 | Phase 17 | Pending |
| DEMO-01 | Phase 18 | Pending |
| INT-01 | Phase 18 | Pending |
| INT-02 | Phase 14 | Pending |
| DEP-04 | Phase 14 | Pending |

**Coverage:**
- v2 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-13*
*Last updated: 2026-07-13 after milestone v2.0 requirements definition*
