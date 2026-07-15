# Phase 17: Weather Integration - Research

**Researched:** 2026-07-15
**Domain:** OpenWeatherMap API integration, server-side proxy patterns, client-side weather polling, simulation input adjustment
**Confidence:** HIGH

## Summary

Phase 17 integrates OpenWeatherMap (OWM) current weather data into the Predictive Fan Flow Simulator. A server-side Next.js route handler proxies OWM calls (keeping the API key server-side), a `useWeather` hook polls every 10 minutes with exponential backoff and Page Visibility API awareness, and the fetched weather condition is mapped to a `WeatherImpact` enum that drives zone/gate density adjustments before calling `simulateDeterministic()`.

This research confirms the standard OWM Current Weather API endpoint (`/data/2.5/weather`) at 60 calls/minute free-tier limit is safe for a single-city poll at 10-minute intervals (~4,320 calls/month). The OWM weather condition codes are stable and map cleanly to the four `WeatherImpact` states (none/rain/heat/storm). The existing polling pattern (`useMatchPoller`) is a direct model for `useWeather`, and the existing API proxy route (`/api/match`) is a direct model for `/api/weather`.

**Primary recommendation:** Use the established proxy/poll/slice patterns already in the codebase. Implement `/api/weather` as a server-only route with `import 'server-only'`, Zod-validate the OWM raw response, map conditions to WeatherImpact, and replicate the `useMatchPoller` visibility/backoff logic exactly in `useWeather`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-17-01:** Weather modifies sim input directly — adjust zone capacities (for heat) and gate throughputs (for rain) on the SimulationInput before calling `simulateDeterministic()`.
- **D-17-02:** Rain → gate throughput reduced by 15%. Heat → zone capacity reduced by 15%. Storm → both at 25% reduction.
- **D-17-03:** Weather adjustment runs client-side in `useWeather` hook. Hook fetches from `/api/weather` proxy, applies adjustments to sim input locally, calls `simulateDeterministic()` with adjusted params, updates `weatherSlice` with both weather data and impact summary.
- **D-17-04:** Auto re-sim on weather condition change — when a fresh weather fetch shows different conditions (e.g., clear→rain), auto re-run sim with adjusted params.
- **D-17-05:** WeatherCard positioned below MatchBanner, above dashboard content in the dashboard layout (same level as MatchBanner, not in the page).
- **D-17-06:** Card displays: temperature, weather condition text + icon (lucide-react), humidity, and an impact severity chip.
- **D-17-07:** Impact note text on card: "Rain: Throughput -15%", "Heat: Capacity -15%", etc.
- **D-17-08:** Loading state: skeleton loader (matches MatchBanner). Error state: amber warning with retry countdown. Preserves last-known data on subsequent errors.
- **D-17-09:** `useWeather` hook parallel to `useMatchPoller` pattern — callback refs, cleanup on unmount, Page Visibility API pause/resume, exponential backoff on error.
- **D-17-10:** Poll interval: 10 minutes.
- **D-17-11:** `/api/weather` returns OWM data mapped to `WeatherDataSchema`. Zod-validated at the boundary. Same proxy pattern as `/api/match`.
- **D-17-12:** Hardcode city: "New York, US" via OWM city name endpoint.
- **D-17-13:** OWM_API_KEY env var already scoped (DEP-04). Used via `process.env.OWM_API_KEY` in `/api/weather` route.

### the agent's Discretion
- Weather→lucide-react icon mapping
- Specific layout spacing for WeatherCard
- Impact severity color treatment
- Weather data mapping function in `src/lib/api/weather.ts`

### Deferred Ideas (OUT OF SCOPE)
- None deferred.
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OWM API call + data transformation | API / Backend (Route Handler) | — | `/api/weather` route handler proxies OWM, maps raw weather to `WeatherDataSchema`, keeps API key server-side |
| Weather polling + density adjustment | Browser / Client | — | `useWeather` hook runs client-side: fetches from proxy, applies adjustments to sim input, calls `simulateDeterministic()` |
| Weather data display (WeatherCard) | Browser / Client | — | React component rendered in dashboard layout, reads from Zustand store |
| Weather state management | Browser / Client | — | Zustand `weatherSlice` in `liveStore` holds current weather data and impact |
| Weather-adjusted simulation | Browser / Client | — | `simulateDeterministic()` called with adjusted `SimulationInput` params in `useWeather` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenWeatherMap API | v2.5 (current weather) | Fetch current weather for New York, US | Only source needed; free tier fits 10-min poll cadence |
| Next.js Route Handlers | Next.js 16 | Server-side proxy to OWM | Existing pattern from `/api/match` route; keeps API key server-side |
| Zod | ^4.3.6 | Validate both OWM raw response and output `WeatherDataSchema` | Already in project; D-11 mandates Zod at all API boundaries |
| Zustand (vanilla) | ^5.0.12 | `weatherSlice` in `liveStore` | Already wired; `weatherSlice` exists with `WeatherImpact` type |
| lucide-react | ^1.8.0 | Weather condition icons (Sun, Cloud, CloudRain, etc.) | Already in project for MatchBanner icons |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `server-only` | ^0.0.1 | Build-time barrier preventing server code leak to client | Every server-side module that reads `process.env` |
| shadcn Card / Badge / Skeleton | via components.json | WeatherCard UI primitives | Already initialized; documented in UI-SPEC.md |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OWM current weather API | OWM One Call API 3.0 | One Call has 1,000 calls/day free but is a separate subscription; current weather free tier (60/min, 1M/month) is more than sufficient for single-city 10-min polling |
| City name endpoint | Geocoding API + coordinates | City name is simpler and locked by D-17-12; coordinates would add extra latency and complexity |
| Server-side proxy | Client-side direct call | Exposes API key to browser — unacceptable. Proxy pattern is required by D-17-11 and industry best practice |

**Installation:**
```bash
pnpm add server-only
```

**Version verification:** `server-only` is a tiny Next.js package (~v0.0.1). OWM has no npm package — the proxy calls the REST API directly via `fetch`.

## Package Legitimacy Audit

> This phase installs one new package: `server-only`.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `server-only` | npm | ~5 yrs | 15M+/wk | github.com/vercel/next.js (monorepo) | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*No OWM npm package is needed. The proxy calls the OWM REST API directly via `fetch`.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Client)                                                    │
│                                                                      │
│  ┌─────────────────────┐    ┌──────────────────────────────┐         │
│  │  DashboardPage       │    │  DashboardLayout              │         │
│  │  - useMatchPoller()  │    │  ┌────────────────────────┐ │         │
│  │  - useWeather() ─────┼────┼──┤  MatchBanner           │ │         │
│  │  - initializeSim()   │    │  ├────────────────────────┤ │         │
│  │  - useLiveStore      │    │  │  WeatherCard ← reads───┼──────┐   │
│  └─────────┬────────────┘    │  └────────────────────────┘ │      │   │
│            │                 └──────────────────────────────┘      │   │
│            ▼                                                       │   │
│  ┌────────────────────────┐                                       │   │
│  │  useWeather() hook      │                                       │   │
│  │  - fetches /api/weather │                                       │   │
│  │  - maps WeatherImpact   │                                       │   │
│  │  - adjusts sim input    │                                       │   │
│  │  - calls simulate()     │                                       │   │
│  │  - writes weatherSlice  │                                       │   │
│  └─────────┬──────────────┘                                       │   │
│            │                                                       │   │
└────────────┼───────────────────────────────────────────────────────┘
             │ fetch() 10-min interval
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js Server (Node.js)                                            │
│                                                                      │
│  ┌──────────────────────────────────────┐                           │
│  │  GET /api/weather (Route Handler)     │                           │
│  │  - reads process.env.OWM_API_KEY     │                           │
│  │  - import 'server-only'              │                           │
│  │  - fetch OWM Current Weather API     │                           │
│  │  - Zod-validate OWM raw response     │                           │
│  │  - map to WeatherDataSchema          │                           │
│  │  - return mapped JSON                │                           │
│  └──────────────────┬───────────────────┘                           │
│                     │ https fetch                                   │
│                     ▼                                                │
│  ┌──────────────────────────────────────┐                           │
│  │  OpenWeatherMap API                   │                           │
│  │  api.openweathermap.org/data/2.5/    │                           │
│  │  weather?q=New York,US&units=metric  │                           │
│  │  &appid=OWM_API_KEY                  │                           │
│  └──────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/
│   └── api/
│       └── weather/
│           └── route.ts              # OWM proxy (implement stub)
├── components/
│   └── dashboard/
│       └── WeatherCard.tsx           # NEW: weather display component
├── hooks/
│   └── useWeather.ts                 # NEW: weather polling hook
├── lib/
│   └── api/
│       └── weather.ts                # NEW: OWM mapping utilities
├── stores/
│   └── slices/
│       └── weatherSlice.ts           # Modify: add impact summary if needed
└── types/
    └── weather.ts                    # WeatherDataSchema (already exists)
```

### Pattern 1: Server-side OWM Proxy Route (follows `/api/match` pattern)

**What:** Next.js Route Handler that proxies OWM API calls, keeping the API key server-side.

**When to use:** All external API calls with secrets must go through this pattern.

**Example:**
```typescript
// src/app/api/weather/route.ts — implementation pattern
import { type NextRequest } from "next/server";
import "server-only";
import { z } from "zod";

// OWM raw response Zod schema (only fields we need)
const OWMResponseSchema = z.object({
  weather: z.array(
    z.object({
      main: z.string(),
      description: z.string(),
      icon: z.string(),
    })
  ).min(1),
  main: z.object({
    temp: z.number(),
    humidity: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
  }).optional(),
  name: z.string(),
});

export async function GET(_request: NextRequest) {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OWM_API_KEY not configured", status: "error" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.openweathermap.org/data/2.5/weather?q=New%20York,US&units=metric&appid=" + apiKey,
      { signal: AbortSignal.timeout(10_000) }
    );

    if (!response.ok) {
      return Response.json(
        { error: `Upstream returned ${response.status}`, status: "upstream_error" },
        { status: 502 }
      );
    }

    const raw = (await response.json()) as unknown;
    const parsed = OWMResponseSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid upstream data", status: "parse_error", issues: parsed.error.issues },
        { status: 502 }
      );
    }

    // Map to WeatherDataSchema
    const weatherData = mapOwmToWeatherData(parsed.data);
    return Response.json(weatherData);
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Network failure", status: "fetch_error" },
      { status: 502 }
    );
  }
}
```

### Pattern 2: Weather Impact Mapping from OWM Condition Codes

**What:** Map OWM `weather[0].main` and temperature to `WeatherImpact`.

**When to use:** Every `/api/weather` response must calculate impact before returning.

**OWM Condition Code Groups:**

| OWM `weather.main` | Code Range | WeatherImpact | Density Adjustment |
|---|---|---|---|
| Thunderstorm | 200–232 | `storm` | Throughput -25%, Capacity -25% |
| Rain | 500–531 | `rain` | Throughput -15% |
| Drizzle | 300–321 | `rain` | Throughput -15% |
| Snow | 600–622 | `none` | No adjustment |
| Atmosphere (Mist/Fog/Haze etc.) | 700–781 | `none` | No adjustment |
| Clear | 800 | `none` (or `heat` if temp ≥ 35°C) | No adj. (or Capacity -15% if heat) |
| Clouds | 801–804 | `none` (or `heat` if temp ≥ 35°C) | No adj. (or Capacity -15% if heat) |

**Heat detection:** Per D-17-02, "Heat → zone capacity reduced by 15%." The `WeatherImpact` enum includes `heat`. A reasonable threshold (agent's discretion): **main.temp ≥ 35°C (95°F)** qualifies as "heat" for stadium events. This maps `Clear` + high temp → `heat` impact.

**Example mapping function:**
```typescript
// src/lib/api/weather.ts
export type WeatherImpact = "none" | "rain" | "heat" | "storm";

const HEAT_THRESHOLD_C = 35;

export function determineImpact(
  weatherMain: string,
  temperatureC: number
): WeatherImpact {
  // Weather condition code groups map to impact
  switch (weatherMain) {
    case "Thunderstorm":
      return "storm";
    case "Rain":
    case "Drizzle":
      return "rain";
    case "Snow":
    case "Atmosphere":
    case "Clear":
    case "Clouds":
    default:
      // Heat is temperature-based, not condition-based
      if ((weatherMain === "Clear" || weatherMain === "Clouds") && temperatureC >= HEAT_THRESHOLD_C) {
        return "heat";
      }
      return "none";
  }
}
```

### Pattern 3: Client-side Polling Hook (modeled on `useMatchPoller`)

**What:** A `useWeather` hook that polls `/api/weather`, handles visibility/pause, exponential backoff.

**When to use:** Following the established polling pattern from Phase 14.

**Key parameters (from `useMatchPoller`):**
- `POLL_INTERVAL = 600_000` (10 min, vs match poller's 30s)
- `MAX_RETRIES = 3`
- `RETRY_BASE = 1_000` (1s)
- Backoff pattern: 1s → 2s → 4s → give up with error
- Visibility API: pause on `document.hidden`, immediate fetch on `visibilitychange` to visible

**Weather-adjusted simulation flow (inside hook):**
1. Fetch from `/api/weather`
2. If conditions changed from previous fetch:
   - Clone current `SimulationInput` from store or preset
   - Apply density adjustments based on `weather.impact`:
     - `rain`: `gate.throughputPerMin *= 0.85`
     - `heat`: `zone.capacity *= 0.85`
     - `storm`: both at 0.75
   - Call `simulateDeterministic(adjustedInput)`
3. Update `weatherSlice` with weather data + impact

**Edge case:** On initial load, if weather data isn't available yet, run sim with `presets.normal` (no adjustment). Weather data arriving later triggers the "change" flow.

### Anti-Patterns to Avoid

- **Passing `OWM_API_KEY` to the client:** Never prefix with `NEXT_PUBLIC_`. Never put it in a client component. The whole point of the proxy is to keep it server-side.
- **Calling OWM directly from the browser:** Defeats proxy purpose; exposes API key.
- **Calling OWM on every page navigation:** Should only poll on dashboard mount (10-min interval), not on every route change.
- **Mutating presets directly:** Presets must remain immutable. Weather adjustments should clone and modify a copy.
- **Blocking on weather fetch for initial render:** Weather data is additive (impact display + optional density adjustment). The simulation should run immediately with `presets.normal` and re-run when weather arrives.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Weather polling with backoff | Custom retry logic | Copy `useMatchPoller` pattern | Already debugged, handles visibility/pause/resume correctly |
| HTTP fetch with timeout | Raw fetch without timeout | `AbortSignal.timeout(10_000)` | Prevents hung requests when OWM is slow; already used in `/api/match` |
| Server-side API key storage | Hardcoded key or client env vars | `process.env.OWM_API_KEY` with `import 'server-only'` | Build-time safety against accidental client exposure |

**Key insight:** The codebase already has battle-tested patterns for every sub-problem in this phase. Copy-extend is faster and safer than inventing.

## Common Pitfalls

### Pitfall 1: Temperature in Kelvin by Default
**What goes wrong:** OWM returns temperature in Kelvin by default. Code displays "301°C" instead of "28°C".
**Why it happens:** OWM's default unit is Kelvin. You must specify `units=metric` in the query string.
**How to avoid:** Always append `&units=metric` to the OWM URL. The `main.temp` field will then be in Celsius (float).
**Warning signs:** Temperature values > 100 in the UI.

### Pitfall 2: Missing API Key Crash
**What goes wrong:** Route handler crashes or returns 500 because `process.env.OWM_API_KEY` is undefined.
**Why it happens:** The env var isn't set in `.env` or deployment environment. Phase 14 scoped DEP-04 but the actual key may not be present.
**How to avoid:** Check for the key at the top of the handler and return a clear 500 error (as `/api/match` does for `WORLDCUP26_TOKEN`). Log a warning.
**Warning signs:** Route returns `{"error": "OWM_API_KEY not configured", "status": "error"}` with 500 status.

### Pitfall 3: Race Condition on Weather Change During Active Poll
**What goes wrong:** A weather fetch completes while a previous sim re-run is still in progress, causing stale or overlapping state updates.
**Why it happens:** The hook's `doFetch` is async and not queued; rapid visibility changes can trigger overlapping fetches.
**How to avoid:** Use a fetch lock (e.g., `isFetchingRef`) to discard responses that are no longer relevant. The existing `useMatchPoller` avoids this via the 30s interval, but on visibility resume the fetch fires immediately. Add a simple `isFetchingRef` guard.
**Warning signs:** Console logs showing back-to-back re-sim calls with the same conditions.

### Pitfall 4: Mutating SimulationInput Instead of Cloning
**What goes wrong:** Weather adjustment modifies the preset in-place, causing all subsequent simulations to use reduced values even after weather clears.
**Why it happens:** `presets.normal` is a const object; reassigning its `capacity` or `throughputPerMin` fields modifies the shared reference.
**How to avoid:** Always deep-clone the preset before adjustment:
```typescript
const adjusted: SimulationInput = JSON.parse(JSON.stringify(presets.normal));
// Then adjust adjusted.zones / adjusted.gates
```
**Warning signs:** After weather returns to clear, simulation still shows reduced throughput.

## Code Examples

### OWM Current Weather API Call

```
GET https://api.openweathermap.org/data/2.5/weather?q=New%20York,US&units=metric&appid=YOUR_API_KEY
```

Response:
```json
{
  "weather": [
    { "id": 501, "main": "Rain", "description": "moderate rain", "icon": "10d" }
  ],
  "main": {
    "temp": 18.2,
    "humidity": 78
  },
  "wind": {
    "speed": 5.14
  },
  "name": "New York",
  "cod": 200
}
```

**Source:** [CITED: openweathermap.org/current] [CITED: openweathermap.org/weather-conditions]

### Simulation Input Adjustment (density application)

```typescript
// Pattern for applying weather adjustments to sim input
import { presets, type PresetName } from "@/simulation/presets";
import type { SimulationInput } from "@/simulation/contracts/input.schema";

function applyWeatherAdjustment(
  base: SimulationInput,
  impact: WeatherImpact
): SimulationInput {
  const adjusted: SimulationInput = JSON.parse(JSON.stringify(base));

  switch (impact) {
    case "rain":
      // Reduce gate throughput by 15%
      adjusted.gates = adjusted.gates.map((gate) => ({
        ...gate,
        throughputPerMin: Math.round(gate.throughputPerMin * 0.85),
      }));
      break;
    case "heat":
      // Reduce zone capacity by 15%
      adjusted.zones = adjusted.zones.map((zone) => ({
        ...zone,
        capacity: Math.round(zone.capacity * 0.85),
      }));
      break;
    case "storm":
      // Reduce both by 25%
      adjusted.gates = adjusted.gates.map((gate) => ({
        ...gate,
        throughputPerMin: Math.round(gate.throughputPerMin * 0.75),
      }));
      adjusted.zones = adjusted.zones.map((zone) => ({
        ...zone,
        capacity: Math.round(zone.capacity * 0.75),
      }));
      break;
    case "none":
      // No adjustment
      break;
  }

  return adjusted;
}
```

**Source:** [ASSUMED] — based on project's existing `SimulationInput` type and preset structure verified in codebase.

### WeatherCard State Machine

The WeatherCard has 5 states per UI-SPEC.md:

| State | Trigger | Rendered UI |
|-------|---------|-------------|
| Loading | `weather === null && !error` | Skeleton (h-12 w-12 icon + text skeletons) |
| Loaded: No Impact | `weather !== null && impact === "none"` | Sun icon, temp, conditions, humidity/wind, "No Impact" badge |
| Loaded: Rain Impact | `weather !== null && impact === "rain"` | CloudRain icon, blue "Rain" badge, "Rain: Gate throughput -15%" note |
| Loaded: Heat Impact | `weather !== null && impact === "heat"` | Sun icon, amber "Heat" badge, "Heat: Zone capacity -15%" note |
| Loaded: Storm Impact | `weather !== null && impact === "storm"` | CloudLightning icon, destructive "Storm" badge, "Storm: Throughput & capacity -25%" note |
| Error (no prior data) | `error && weather === null` | TriangleAlert + "Weather data unavailable — retrying..." |
| Error (with prior data) | `error && weather !== null` | Loaded state + amber warning bar at top |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OWM One Call API 3.0 (paid) | OWM Current Weather API (free) | Always separate | Free tier (60/min, 1M/month) is sufficient for single-city polling |
| OWM city name endpoint (deprecated geocoder) | Still functional but built-in geocoder deprecated | 2024 | Use city name `?q=New%20York,US` — still works but coordinates are preferred for new apps. D-17-12 locks us to city name for demo. |

**Deprecated/outdated:**
- Built-in geocoder in OWM city name endpoint is deprecated per OWM docs. We use it anyway per D-17-12 (demo predictability).
- OWM XML format is legacy — JSON is default.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Heat threshold of 35°C (95°F) is reasonable for triggering `heat` impact | Code Examples, Standard Stack | Low — threshold is agent's discretion per CONTEXT.md. If user disagrees, change constant |
| A2 | OWM API key is stored as `OWM_API_KEY` (matching DEP-04 convention) | Security Domain | Medium — if the env var name differs, the 500 error path will catch it at runtime. Planner should verify existence before assuming |
| A3 | `server-only` package installs without peer-dependency issues | Package Legitimacy Audit | Low — it's a core Next.js package shipped by Vercel |

**If this table is empty:** No, there are 3 assumed claims that need confirmation before locked decisions.

## Open Questions (RESOLVED)

1. **Is `OWM_API_KEY` already set in `.env`?** *(RESOLVED)*
   - What we know: DEP-04 was completed in Phase 14, and D-17-13 states the env var is "already scoped."
   - Resolution: Route handler gracefully returns 500 with clear error message if key is missing. No explicit checkpoint needed — runtime catches misconfiguration safely.

2. **Should `useWeather` store fetched condition as previous impact for change detection?** *(RESOLVED)*
   - What we know: D-17-04 requires auto re-sim on weather condition change.
   - Resolution: Use `impact` enum comparison (simpler, fewer re-sims). Store previous impact in a ref inside the hook, as recommended by research.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js server runtime | ✓ | 26.3.0 | — |
| npm/pnpm | Package installs | ✓ | pnpm 10.28.0 | — |
| Next.js | Route handler, app router | ✓ | 16.0.0+ | — |

**Missing dependencies with no fallback:** none (all code/config changes)

## Validation Architecture

> nyquist_validation enabled — include this section.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (from vitest.config.ts) |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm vitest run --changed` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WTHR-01 | `/api/weather` proxy returns mapped WeatherDataSchema | integration (route handler) | `pnpm vitest run tests/api/weather.test.ts` | ❌ Wave 0 |
| WTHR-01 | `/api/weather` returns 500 when OWM_API_KEY missing | integration | (same file) | ❌ Wave 0 |
| WTHR-01 | `/api/weather` returns 502 on upstream error | integration | (same file) | ❌ Wave 0 |
| WTHR-01 | Weather data maps correctly from OWM raw response | unit | `pnpm vitest run tests/lib/api/weather.test.ts` | ❌ Wave 0 |
| WTHR-01 | WeatherImpact determined correctly from condition codes | unit | (same file) | ❌ Wave 0 |
| WTHR-01 | SimulationInput adjusted correctly for each WeatherImpact | unit | (same file) | ❌ Wave 0 |
| WTHR-02 | `useWeather` hook polls at 10-min interval | smoke (manual or e2e) | — | ❌ manual-only |
| WTHR-02 | WeatherCard renders all 5 states correctly | unit | `pnpm vitest run tests/components/WeatherCard.test.tsx` | ❌ Wave 0 |
| WTHR-02 | WeatherCard preserves stale data on error | unit | (same file) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm vitest run --changed`
- **Per wave merge:** `pnpm vitest run tests/api/weather.test.ts tests/lib/api/weather.test.ts tests/components/WeatherCard.test.tsx`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/api/weather.test.ts` — covers WTHR-01 (proxy, validation, error paths)
- [ ] `tests/lib/api/weather.test.ts` — covers OWM-to-WeatherData mapping, WeatherImpact determination, sim input adjustment
- [ ] `tests/components/WeatherCard.test.tsx` — covers all 5 visual states and error-with-data stale data preservation
- [ ] Framework install: none needed (Vitest already configured in root)

## Security Domain

> Required — security_enforcement is enabled (absent from config is treated as enabled).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No user auth needed for weather proxy |
| V3 Session Management | no | Stateless proxy |
| V4 Access Control | no | Public demo endpoint (weather data is non-sensitive) |
| V5 Input Validation | yes | Zod schema at route boundary validates OWM raw response |
| V6 Cryptography | no | No encryption needed; API key transmitted via HTTPS |

### Known Threat Patterns for Next.js + OWM

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure via client bundle | Information Disclosure | `import 'server-only'` on route handler; never use `NEXT_PUBLIC_` prefix; key only accessed via `process.env` inside server context |
| API key theft via server-side leak | Information Disclosure | Do not log `process.env.OWM_API_KEY`; sanitize error responses (no stack traces with env values) |
| Unlimited proxy abuse (cost) | Denial of Service | 10-min polling interval limits calls to ~4,320/month; no user-facing trigger that could amplify calls |
| OWM response spoofing | Spoofing | HTTPS fetch to OWM; Zod validation rejects malformed upstream data |
| OWM rate limit exhaustion | Denial of Service | 10-min poll is well within 60/min free limit; if exceeded, the 429 from OWM propagates as 502 upstream_error |

**Key principle:** The `/api/weather` route handler is a thin, stateless proxy. No authentication is needed because:
- It only reads weather data (no mutations)
- It is rate-limited by the 10-min poll interval
- The OWM response is public weather data
- The API key is the only secret and it never leaves the server

## Sources

### Primary (HIGH confidence)
- Context7 `/llmstxt/openweathermap_llms_txt` — OWM current weather API response fields, endpoint URL, response examples [VERIFIED: npm registry via Context7]
- Context7 `/websites/openweathermap_api` — OWM API pricing, free tier limits, condition codes [CITED: openweathermap.org]
- Next.js Data Security Guide (nextjs.org/docs/app/guides/data-security) — server-only patterns, env var management [CITED: nextjs.org]
- WebSearch: openweathermap.org/current — confirmed endpoint and response format [CITED: openweathermap.org/current]
- WebSearch: openweathermap.org/weather-conditions — condition code groups 2xx–80x [CITED: openweathermap.org/weather-conditions]
- Codebase: `src/hooks/useMatchPoller.ts` — verified polling pattern with exponential backoff [VERIFIED: project codebase]
- Codebase: `src/app/api/match/route.ts` — verified proxy route handler pattern [VERIFIED: project codebase]
- Codebase: `src/stores/slices/weatherSlice.ts` — verified WeatherImpact type and slice structure [VERIFIED: project codebase]

### Secondary (MEDIUM confidence)
- APIScout "OpenWeatherMap Free Tier Limits 2026" — confirms free tier details [CITED: apiscout.dev]
- WebSearch OWM pricing page — confirmed free tier: 60 calls/min, 1M calls/month [CITED: openweathermap.org/price]
- WebSearch OWM FAQ — confirmed API key auth via `appid` parameter, rate limit behavior [CITED: openweathermap.org/faq]

### Tertiary (LOW confidence)
- None — all key claims were verified against official sources or the codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages and services verified against official docs and current project
- Architecture: HIGH — patterns replicate existing, tested code in the same project
- Pitfalls: HIGH — based on well-documented OWM behaviors and common Next.js mistakes
- Security: HIGH — follows official Next.js security guidance with server-only isolation

**Research date:** 2026-07-15
**Valid until:** 2026-08-15 (OWM API is stable; 30-day validity is safe)
