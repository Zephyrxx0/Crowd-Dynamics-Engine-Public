# Challenge 04 — Implementation Plan
## Crowd Dynamics Engine → Smart Stadium Operations (FIFA WC 2026)

> **Stack:** Next.js (App Router, full-stack) · **Time budget:** 7 days · **Submission:** Live deployed URL  
> **Core add:** Real-time match event feed → crowd simulation coupling + GenAI ops/fan layer

---

## 0. Understanding your starting point

Based on the live demo at `prompt-wars-724615471177.us-central1.run.app`, your engine already has:

| What you have | Role in Challenge 04 |
|---|---|
| Configure scenario → run simulation | Core ops engine ✅ |
| Zone heatmap output | Primary visual ✅ |
| Bottleneck detection | Safety intelligence ✅ |
| Staff allocation optimizer | Ops decision support ✅ |
| Crisis scenario mode | Emergency response ✅ |
| Compare + Report tabs | Evaluation surface ✅ |
| Claude/OpenAI API wired somewhere | GenAI hook (needs repositioning) ⚠️ |

**The gap the challenge cares about:** Your AI is currently *post-simulation* (summarising a finished run). The winning move is putting it *inside the simulation loop* — generating alerts as zone densities change in response to live match events. That is the line between "tool" and "intelligent system."

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your existing engine                         │
│          (zone heatmap · bottleneck detection · staff ops)       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ zone state JSON (every tick)
          ┌────────────▼────────────┐
          │   simulationStore.ts    │  ← Zustand client store
          │  (zones, phase, match)  │     holds live sim state
          └──┬──────────┬───────────┘
             │          │
    ┌─────────▼──┐   ┌──▼──────────────┐
    │  /api/      │   │  /api/          │
    │  match/     │   │  ai-alerts/     │
    │  poll       │   │  stream         │
    └─────────────┘   └─────────────────┘
         ↑                    ↑
  worldcup26.ir          Anthropic SDK
  (30s interval)         (SSE stream)
         
             ┌───────────────────────────┐
             │  /fan  route              │
             │  Fan chatbot              │
             │  (same sim state,         │
             │   different system prompt)│
             └───────────────────────────┘
```

**Key principle:** The simulation state is the single source of truth. Both the ops AI alerts and the fan chatbot read from the same `simulationStore`. The only new data sources are:

1. `worldcup26.ir` → match events → mutate sim params
2. OpenWeatherMap → city weather → mutate sim params
3. Claude API → read sim state → stream ops alerts / fan responses

---

## 2. New files to create

```
src/
├── app/
│   ├── api/
│   │   ├── match/
│   │   │   └── route.ts          # Polls worldcup26.ir, returns live match state
│   │   ├── ai-alerts/
│   │   │   └── route.ts          # SSE: zone state → Claude → streamed alert
│   │   ├── fan-chat/
│   │   │   └── route.ts          # POST: fan question + zone context → Claude answer
│   │   └── weather/
│   │       └── route.ts          # Proxies OpenWeatherMap for a given stadium city
│   └── fan/
│       └── page.tsx              # Fan-facing route (/fan)
├── components/
│   ├── ops/
│   │   ├── AlertFeed.tsx         # Live scrolling AI alert stream
│   │   ├── MatchBanner.tsx       # Live match score + phase indicator
│   │   └── WeatherCard.tsx       # Current conditions card
│   └── fan/
│       ├── FanChat.tsx           # Fan chatbot UI
│       └── StadiumSelector.tsx   # Venue dropdown (3 featured stadiums)
├── hooks/
│   ├── useMatchPoller.ts         # Polls /api/match every 30s, mutates sim
│   └── useAlertStream.ts         # Opens SSE to /api/ai-alerts
├── lib/
│   ├── matchEventMap.ts          # Maps event types → sim param deltas
│   ├── stadiumData.ts            # 16 WC2026 venues: name, city, capacity, coords
│   └── weatherParamMap.ts        # Maps weather conditions → sim adjustments
└── store/
    └── simulationStore.ts        # Zustand store: zones, matchState, weatherState
```

---

## 3. Day-by-day implementation

### Days 1–2 — Live match feed → simulation coupling

**Goal:** By end of Day 2, your simulation responds to what's actually happening in the World Cup.

#### 3.1 Zustand simulation store

Install Zustand if not already present:

```bash
npm install zustand
```

Create `src/store/simulationStore.ts`. This is the central state object that everything reads from and writes to:

```typescript
import { create } from 'zustand'

export type ZoneId = string

export interface ZoneState {
  id: ZoneId
  name: string
  capacity: number
  current: number          // current fan count
  density: number          // 0–1 ratio
  staffCount: number
  bottleneck: boolean
}

export interface MatchState {
  matchId: string | null
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  phase: 'pre' | 'first_half' | 'half_time' | 'second_half' | 'full_time' | 'extra_time'
  minute: number
  lastEvent: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'kick_off' | null
  lastEventMinute: number | null
  stadium: string
  stadiumCity: string
}

export interface WeatherState {
  condition: 'clear' | 'rain' | 'storm' | 'snow' | 'extreme_heat' | 'unknown'
  tempC: number
  humidity: number
  description: string
}

interface SimulationStore {
  zones: ZoneState[]
  matchState: MatchState | null
  weatherState: WeatherState | null
  isSimulationRunning: boolean
  selectedStadiumId: string

  // Actions
  setZones: (zones: ZoneState[]) => void
  updateZoneDensities: (deltas: Record<ZoneId, number>) => void
  setMatchState: (match: MatchState) => void
  setWeatherState: (weather: WeatherState) => void
  setSelectedStadium: (id: string) => void
  applyMatchEventDelta: (eventType: string) => void
  applyWeatherDelta: (condition: string) => void
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  zones: [],
  matchState: null,
  weatherState: null,
  isSimulationRunning: false,
  selectedStadiumId: 'metlife',

  setZones: (zones) => set({ zones }),

  updateZoneDensities: (deltas) => set((state) => ({
    zones: state.zones.map(z => {
      const delta = deltas[z.id] ?? 0
      const newCurrent = Math.min(z.capacity, Math.max(0, z.current + Math.floor(z.capacity * delta)))
      return { ...z, current: newCurrent, density: newCurrent / z.capacity, bottleneck: newCurrent / z.capacity > 0.85 }
    })
  })),

  setMatchState: (match) => set({ matchState: match }),
  setWeatherState: (weather) => set({ weatherState: weather }),
  setSelectedStadium: (id) => set({ selectedStadiumId: id }),

  applyMatchEventDelta: (eventType) => {
    const { matchEventMap } = require('@/lib/matchEventMap')
    const deltas = matchEventMap[eventType] ?? {}
    get().updateZoneDensities(deltas)
  },

  applyWeatherDelta: (condition) => {
    const { weatherParamMap } = require('@/lib/weatherParamMap')
    const deltas = weatherParamMap[condition] ?? {}
    get().updateZoneDensities(deltas)
  },
}))
```

#### 3.2 Stadium data

Create `src/lib/stadiumData.ts` with the 3 featured venues for your demo (you can extend to all 16 later):

```typescript
export interface Stadium {
  id: string
  name: string
  fifaName: string
  city: string
  country: 'USA' | 'Canada' | 'Mexico'
  capacity: number
  lat: number
  lng: number
  owmCity: string       // City name for OpenWeatherMap query
  zones: {
    id: string
    name: string
    capacityPercent: number  // % of total capacity
  }[]
}

export const STADIUMS: Record<string, Stadium> = {
  metlife: {
    id: 'metlife',
    name: 'MetLife Stadium',
    fifaName: 'New York/New Jersey Stadium',
    city: 'East Rutherford, NJ',
    country: 'USA',
    capacity: 82500,
    lat: 40.8135,
    lng: -74.0745,
    owmCity: 'East Rutherford',
    zones: [
      { id: 'gate_north', name: 'Gate A–C (North)', capacityPercent: 0.12 },
      { id: 'gate_south', name: 'Gate D–F (South)', capacityPercent: 0.12 },
      { id: 'gate_east', name: 'Gate G–H (East)', capacityPercent: 0.08 },
      { id: 'gate_west', name: 'Gate I–J (West)', capacityPercent: 0.08 },
      { id: 'concourse_lower', name: 'Lower Concourse', capacityPercent: 0.20 },
      { id: 'concourse_upper', name: 'Upper Concourse', capacityPercent: 0.15 },
      { id: 'field_level', name: 'Field Level', capacityPercent: 0.15 },
      { id: 'vip_suites', name: 'VIP / Suites', capacityPercent: 0.05 },
      { id: 'concessions_main', name: 'Concessions Hub', capacityPercent: 0.05 },
    ]
  },
  sofi: {
    id: 'sofi',
    name: 'SoFi Stadium',
    fifaName: 'Los Angeles Stadium',
    city: 'Inglewood, CA',
    country: 'USA',
    capacity: 70240,
    lat: 33.9535,
    lng: -118.3392,
    owmCity: 'Inglewood',
    zones: [
      { id: 'gate_north', name: 'North Gates', capacityPercent: 0.15 },
      { id: 'gate_south', name: 'South Gates', capacityPercent: 0.15 },
      { id: 'concourse_main', name: 'Main Concourse', capacityPercent: 0.25 },
      { id: 'field_level', name: 'Field Level', capacityPercent: 0.20 },
      { id: 'upper_bowl', name: 'Upper Bowl', capacityPercent: 0.15 },
      { id: 'vip', name: 'VIP / Premium', capacityPercent: 0.05 },
      { id: 'concessions', name: 'Concessions', capacityPercent: 0.05 },
    ]
  },
  azteca: {
    id: 'azteca',
    name: 'Estadio Azteca',
    fifaName: 'Mexico City Stadium',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
    lat: 19.3029,
    lng: -99.1505,
    owmCity: 'Mexico City',
    zones: [
      { id: 'gate_east', name: 'East Entrance', capacityPercent: 0.14 },
      { id: 'gate_west', name: 'West Entrance', capacityPercent: 0.14 },
      { id: 'gate_north', name: 'North Entrance', capacityPercent: 0.10 },
      { id: 'gate_south', name: 'South Entrance', capacityPercent: 0.10 },
      { id: 'concourse', name: 'Concourse Ring', capacityPercent: 0.25 },
      { id: 'field_level', name: 'Field Level', capacityPercent: 0.18 },
      { id: 'upper_tier', name: 'Upper Tier', capacityPercent: 0.09 },
    ]
  }
}
```

#### 3.3 Match event → sim param mapping

Create `src/lib/matchEventMap.ts`. These deltas are applied to zone `density` values as a fraction of zone capacity. Positive = fans moving into zone, negative = leaving:

```typescript
// Match event type → zone density deltas (as fraction of capacity)
// Derived from research on football crowd behaviour patterns

export type ZoneDeltaMap = Record<string, number>

export const matchEventMap: Record<string, ZoneDeltaMap> = {
  // Goal scored: concourse rush, concession spike, gates momentarily clear
  goal: {
    concourse_lower:   +0.18,
    concourse_main:    +0.18,
    concourse:         +0.18,
    concessions_main:  +0.25,
    concessions:       +0.25,
    field_level:       -0.05,
    gate_north:        -0.03,
    gate_south:        -0.03,
  },

  // Half time: biggest movement of match — everyone moves at once
  half_time: {
    gate_north:        +0.05,   // late arrivals coming in
    gate_south:        +0.05,
    concourse_lower:   +0.35,
    concourse_upper:   +0.25,
    concourse_main:    +0.35,
    concourse:         +0.35,
    concessions_main:  +0.40,
    concessions:       +0.40,
    field_level:       -0.20,
    upper_bowl:        -0.15,
    upper_tier:        -0.15,
    vip_suites:        -0.10,
    vip:               -0.10,
  },

  // Kick off (second half): reverse of HT — concourses drain
  kick_off: {
    concourse_lower:   -0.30,
    concourse_upper:   -0.20,
    concourse_main:    -0.30,
    concourse:         -0.30,
    concessions_main:  -0.35,
    concessions:       -0.35,
    field_level:       +0.18,
    upper_bowl:        +0.12,
    upper_tier:        +0.12,
  },

  // Full time: egress surge — all gates spike, concourses fill
  full_time: {
    gate_north:        +0.40,
    gate_south:        +0.40,
    gate_east:         +0.30,
    gate_west:         +0.30,
    concourse_lower:   +0.45,
    concourse_upper:   +0.35,
    concourse_main:    +0.45,
    concourse:         +0.45,
    field_level:       -0.30,
    upper_bowl:        -0.25,
    upper_tier:        -0.25,
    vip_suites:        -0.15,
    vip:               -0.15,
  },

  // Red card: tension spike — minor concourse movement
  red_card: {
    concourse_lower:   +0.06,
    concourse_main:    +0.06,
    concourse:         +0.06,
    concessions_main:  +0.04,
    concessions:       +0.04,
  },

  // Penalty shootout: maximum crowd tension — stays in seats
  penalty_shootout: {
    concourse_lower:   -0.10,
    concourse_main:    -0.10,
    concourse:         -0.10,
    concessions_main:  -0.15,
    concessions:       -0.15,
    field_level:       +0.08,
  },

  // Substitution: very minor movement
  substitution: {
    concourse_lower:   +0.02,
    concessions_main:  +0.02,
    concessions:       +0.02,
  },

  // Extra time announcement: late stayers, some early leavers
  extra_time: {
    gate_north:        +0.08,
    gate_south:        +0.08,
    gate_east:         +0.06,
    gate_west:         +0.06,
    concourse_lower:   +0.05,
    concourse_main:    +0.05,
    concourse:         +0.05,
  },
}
```

#### 3.4 Match polling API route

Create `src/app/api/match/route.ts`. This is a simple server proxy to worldcup26.ir — never call third-party APIs from the client, always proxy through your Next.js API route:

```typescript
import { NextResponse } from 'next/server'

const WC_API = 'https://worldcup26.ir'

// Cache: store last known live match to avoid hammering the API
let cachedMatch: Record<string, unknown> | null = null
let lastFetch = 0
const CACHE_TTL = 25_000 // 25 seconds — poll client every 30s, cache 25s

export async function GET() {
  try {
    const now = Date.now()

    if (cachedMatch && now - lastFetch < CACHE_TTL) {
      return NextResponse.json({ source: 'cache', match: cachedMatch })
    }

    // Fetch all games, find any that are live or recently completed
    const response = await fetch(`${WC_API}/get/games`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      throw new Error(`WC API responded ${response.status}`)
    }

    const data = await response.json()
    const games: Record<string, unknown>[] = Array.isArray(data) ? data : (data.games ?? data.data ?? [])

    // Priority: live > just finished (last 2 hours) > next upcoming
    const now_ts = Math.floor(Date.now() / 1000)

    const live = games.find(g => g.time_elapsed && g.time_elapsed !== 'notstarted' && g.time_elapsed !== 'finished')
    const recent = games.find(g => {
      const finishedAt = g.finished_at ? Number(g.finished_at) : 0
      return g.finished === 'TRUE' && (now_ts - finishedAt) < 7200
    })
    const upcoming = games
      .filter(g => g.finished === 'FALSE' && g.time_elapsed === 'notstarted')
      .sort((a, b) => {
        const aDate = new Date(String(a.local_date)).getTime()
        const bDate = new Date(String(b.local_date)).getTime()
        return aDate - bDate
      })[0]

    const match = live ?? recent ?? upcoming ?? null

    if (match) {
      cachedMatch = match as Record<string, unknown>
      lastFetch = now
    }

    return NextResponse.json({ source: 'live', match })
  } catch (err) {
    console.error('[/api/match]', err)
    // Return cached data on error rather than failing
    return NextResponse.json({ source: 'error', match: cachedMatch, error: String(err) })
  }
}
```

#### 3.5 Match event parser

Create `src/lib/parseMatchEvent.ts` to translate the worldcup26.ir response format into your internal `MatchState`:

```typescript
import type { MatchState } from '@/store/simulationStore'

// worldcup26.ir game object → internal MatchState
export function parseMatchEvent(game: Record<string, unknown>): MatchState {
  const timeElapsed = String(game.time_elapsed ?? 'notstarted')

  let phase: MatchState['phase'] = 'pre'
  if (timeElapsed === 'halftime') phase = 'half_time'
  else if (timeElapsed === 'fulltime' || game.finished === 'TRUE') phase = 'full_time'
  else if (timeElapsed === 'extratime') phase = 'extra_time'
  else if (Number(timeElapsed) > 45) phase = 'second_half'
  else if (Number(timeElapsed) > 0) phase = 'first_half'

  // Infer last event from score changes or status — worldcup26.ir doesn't give
  // granular events, so we detect state transitions between polls
  let lastEvent: MatchState['lastEvent'] = null
  if (phase === 'half_time') lastEvent = 'half_time' as MatchState['lastEvent']
  if (phase === 'full_time') lastEvent = 'full_time' as MatchState['lastEvent']

  return {
    matchId: String(game.id ?? ''),
    homeTeam: String(game.home_team_label ?? game.home_team_id ?? 'Home'),
    awayTeam: String(game.away_team_label ?? game.away_team_id ?? 'Away'),
    homeScore: Number(game.home_score ?? 0),
    awayScore: Number(game.away_score ?? 0),
    phase,
    minute: Number(timeElapsed) || 0,
    lastEvent,
    lastEventMinute: null,
    stadium: String(game.stadium_id ?? ''),
    stadiumCity: '',
  }
}
```

#### 3.6 Match polling hook

Create `src/hooks/useMatchPoller.ts`. This lives in the client and drives the whole real-time loop:

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { parseMatchEvent } from '@/lib/parseMatchEvent'

const POLL_INTERVAL = 30_000 // 30 seconds

export function useMatchPoller() {
  const { setMatchState, applyMatchEventDelta, matchState } = useSimulationStore()
  const prevPhaseRef = useRef<string | null>(null)
  const prevScoreRef = useRef<string>('0-0')

  useEffect(() => {
    let active = true

    const poll = async () => {
      if (!active) return

      try {
        const res = await fetch('/api/match')
        if (!res.ok) return
        const { match } = await res.json()
        if (!match) return

        const parsed = parseMatchEvent(match)
        setMatchState(parsed)

        // Detect phase transitions and fire event deltas
        const currentScore = `${parsed.homeScore}-${parsed.awayScore}`
        const prevPhase = prevPhaseRef.current
        const prevScore = prevScoreRef.current

        if (prevPhase !== null) {
          // Goal scored: score changed
          if (currentScore !== prevScore) {
            applyMatchEventDelta('goal')
          }

          // Phase transitions
          if (prevPhase !== 'half_time' && parsed.phase === 'half_time') {
            applyMatchEventDelta('half_time')
          }
          if (prevPhase === 'half_time' && parsed.phase === 'second_half') {
            applyMatchEventDelta('kick_off')
          }
          if (prevPhase !== 'full_time' && parsed.phase === 'full_time') {
            applyMatchEventDelta('full_time')
          }
          if (prevPhase !== 'extra_time' && parsed.phase === 'extra_time') {
            applyMatchEventDelta('extra_time')
          }
        }

        prevPhaseRef.current = parsed.phase
        prevScoreRef.current = currentScore
      } catch (e) {
        console.warn('[useMatchPoller] fetch failed:', e)
      }
    }

    poll() // immediate on mount
    const interval = setInterval(poll, POLL_INTERVAL)
    return () => { active = false; clearInterval(interval) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
```

**Wire into your ops dashboard layout** — add `useMatchPoller()` near the root of your ops page:

```tsx
// In your existing ops dashboard page/layout
'use client'
import { useMatchPoller } from '@/hooks/useMatchPoller'

export default function OpsDashboard() {
  useMatchPoller() // This is all it takes — runs in background

  // ... rest of your existing dashboard
}
```

---

### Days 3–4 — AI alert stream (Claude in the simulation loop)

**Goal:** Every 45 seconds, zone state is sent to Claude, which streams back an ops alert if action is needed.

#### 4.1 AI alerts API route (SSE)

Create `src/app/api/ai-alerts/route.ts`. This is the most important new route — it's the "GenAI-powered" core of your submission:

```typescript
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const dynamic = 'force-dynamic'

// System prompt — this is your "stadium AI brain"
const OPS_SYSTEM_PROMPT = `You are an AI operations assistant for a FIFA World Cup 2026 stadium command center.

Your role is to analyze real-time crowd density data across stadium zones and generate concise, actionable safety alerts for the operations team.

Rules:
- Only generate an alert if a zone is above 80% capacity, approaching a bottleneck, or if the match phase requires proactive action
- Alerts must be specific: name the zone, state the density %, recommend a concrete action
- Keep alerts to 2–3 sentences maximum
- If no zone requires attention, respond with exactly: "All zones nominal."
- Tone: calm, professional, direct — like a safety coordinator, not a chatbot
- If it's half-time or full-time, always comment on egress/ingress management even if densities look OK
- Prioritise gate zones over concourse zones when both are elevated

Format each alert as:
[ZONE NAME] — [density]% capacity — [recommended action]`

export async function POST(req: NextRequest) {
  try {
    const { zones, matchPhase, matchTeams, weatherCondition } = await req.json()

    // Build the user message with full sim context
    const zoneList = zones
      .map((z: { name: string; density: number; bottleneck: boolean }) =>
        `- ${z.name}: ${Math.round(z.density * 100)}% capacity${z.bottleneck ? ' ⚠ BOTTLENECK' : ''}`
      )
      .join('\n')

    const userMessage = `Current stadium status — FIFA World Cup 2026

Match: ${matchTeams ?? 'Upcoming match'}
Phase: ${matchPhase ?? 'Pre-match'}
Weather: ${weatherCondition ?? 'Unknown'}

Zone densities:
${zoneList}

Generate an operations alert if needed.`

    // Stream the response back as SSE
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 256,   // Alerts should be short — cap tokens
            system: OPS_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userMessage }],
          })

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: chunk.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (e) {
          const errData = JSON.stringify({ error: String(e) })
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
}
```

#### 4.2 Alert stream hook

Create `src/hooks/useAlertStream.ts`:

```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSimulationStore } from '@/store/simulationStore'

export interface Alert {
  id: string
  timestamp: Date
  text: string
  severity: 'nominal' | 'warning' | 'critical'
}

const ALERT_INTERVAL = 45_000 // generate new alert every 45 seconds

function classifySeverity(text: string): Alert['severity'] {
  if (text.includes('All zones nominal')) return 'nominal'
  if (text.includes('BOTTLENECK') || text.includes('critical') || text.includes('evacuate') || text.includes('close gate')) return 'critical'
  return 'warning'
}

export function useAlertStream() {
  const { zones, matchState, weatherState } = useSimulationStore()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateAlert = useCallback(async () => {
    if (zones.length === 0) return
    setIsStreaming(true)

    let accumulated = ''

    try {
      const res = await fetch('/api/ai-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zones: zones.map(z => ({ name: z.name, density: z.density, bottleneck: z.bottleneck })),
          matchPhase: matchState?.phase ?? 'pre',
          matchTeams: matchState ? `${matchState.homeTeam} vs ${matchState.awayTeam}` : null,
          weatherCondition: weatherState?.condition ?? 'unknown',
        })
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) accumulated += parsed.text
          } catch { /* ignore partial chunks */ }
        }
      }

      if (accumulated) {
        const alert: Alert = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          text: accumulated.trim(),
          severity: classifySeverity(accumulated),
        }
        setAlerts(prev => [alert, ...prev].slice(0, 20)) // keep last 20 alerts
      }
    } catch (e) {
      console.warn('[useAlertStream]', e)
    } finally {
      setIsStreaming(false)
    }
  }, [zones, matchState, weatherState])

  useEffect(() => {
    generateAlert()
    timerRef.current = setInterval(generateAlert, ALERT_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [generateAlert])

  return { alerts, isStreaming }
}
```

#### 4.3 AlertFeed component

Create `src/components/ops/AlertFeed.tsx`:

```tsx
'use client'

import { useAlertStream, type Alert } from '@/hooks/useAlertStream'

function AlertRow({ alert }: { alert: Alert }) {
  const colors = {
    nominal: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
    warning: 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
    critical: 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  }

  return (
    <div className={`border-l-4 rounded-r-md px-3 py-2 ${colors[alert.severity]}`}>
      <div className="text-xs opacity-60 mb-1">
        {alert.timestamp.toLocaleTimeString()}
      </div>
      <p className="text-sm leading-relaxed">{alert.text}</p>
    </div>
  )
}

export function AlertFeed() {
  const { alerts, isStreaming } = useAlertStream()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          AI Operations Alerts
        </h3>
        {isStreaming && (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Analysing...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {alerts.length === 0 && !isStreaming && (
          <p className="text-xs text-gray-400 text-center mt-8">
            Waiting for first analysis...
          </p>
        )}
        {alerts.map(a => <AlertRow key={a.id} alert={a} />)}
      </div>
    </div>
  )
}
```

#### 4.4 MatchBanner component

Create `src/components/ops/MatchBanner.tsx`:

```tsx
'use client'

import { useSimulationStore } from '@/store/simulationStore'

const PHASE_LABELS: Record<string, string> = {
  pre: 'Pre-match',
  first_half: 'First half',
  half_time: 'Half time',
  second_half: 'Second half',
  full_time: 'Full time',
  extra_time: 'Extra time',
}

export function MatchBanner() {
  const matchState = useSimulationStore(s => s.matchState)

  if (!matchState) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-500">
        Waiting for live match data...
      </div>
    )
  }

  const isLive = matchState.phase === 'first_half' || matchState.phase === 'second_half' || matchState.phase === 'extra_time'

  return (
    <div className="bg-gray-900 text-white rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        )}
        <span className="text-sm">{PHASE_LABELS[matchState.phase] ?? matchState.phase}</span>
        {matchState.minute > 0 && (
          <span className="text-xs text-gray-400">{matchState.minute}'</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm font-medium">
        <span>{matchState.homeTeam}</span>
        <span className="text-lg font-bold tabular-nums">
          {matchState.homeScore} – {matchState.awayScore}
        </span>
        <span>{matchState.awayTeam}</span>
      </div>
    </div>
  )
}
```

---

### Day 5 — Fan-facing mode (`/fan`)

**Goal:** A second persona. Same simulation data, completely different user experience.

#### 5.1 Fan chat API route

Create `src/app/api/fan-chat/route.ts`. Same structural pattern as the ops route, entirely different system prompt:

```typescript
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FAN_SYSTEM_PROMPT = `You are a helpful stadium assistant for a fan attending a FIFA World Cup 2026 match.

You have access to live crowd density data for all stadium zones. Use this to give fans helpful, practical information.

Your personality: friendly, concise, helpful — like a knowledgeable local guide.

What you can help with:
- Which gate or entrance is least crowded right now
- Where the nearest toilets, food, or merchandise are (based on congestion)
- How long queues might be at concessions (based on current density)
- Safe and efficient routes to their seat or exit
- Match information (current score, phase, time)
- General stadium safety information

What you cannot do:
- Make medical decisions
- Give security or law enforcement instructions
- Promise specific wait times (only estimates based on density)

Keep responses under 80 words. Speak directly to the fan. Always end with something reassuring if there's congestion.`

export async function POST(req: NextRequest) {
  try {
    const { question, zones, matchState, history } = await req.json()

    const zoneContext = zones
      .map((z: { name: string; density: number }) =>
        `${z.name}: ${Math.round(z.density * 100)}% full`
      )
      .join(', ')

    const contextMessage = `Live zone data: ${zoneContext}. Match: ${matchState?.homeTeam ?? '?'} ${matchState?.homeScore ?? 0}–${matchState?.awayScore ?? 0} ${matchState?.awayTeam ?? '?'} (${matchState?.phase ?? 'unknown phase'})`

    const messages = [
      { role: 'user' as const, content: contextMessage },
      { role: 'assistant' as const, content: 'Understood. I have the live stadium data. How can I help you?' },
      ...(history ?? []),
      { role: 'user' as const, content: question },
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const anthropicStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 150,
          system: FAN_SYSTEM_PROMPT,
          messages,
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
}
```

#### 5.2 Fan page

Create `src/app/fan/page.tsx`. This is a completely separate route and UI:

```tsx
import { FanChat } from '@/components/fan/FanChat'
import { StadiumSelector } from '@/components/fan/StadiumSelector'

export const metadata = {
  title: 'Stadium Assistant — FIFA World Cup 2026',
  description: 'Get real-time help navigating your stadium',
}

export default function FanPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#011641] to-[#002c7e] flex flex-col">
      <header className="px-6 pt-8 pb-4">
        <div className="text-xs font-medium text-blue-300 uppercase tracking-widest mb-1">FIFA World Cup 2026</div>
        <h1 className="text-2xl font-semibold text-white">Stadium Assistant</h1>
        <p className="text-blue-200 text-sm mt-1">Ask me anything about the stadium right now</p>
      </header>
      <div className="px-4 pb-2">
        <StadiumSelector />
      </div>
      <div className="flex-1 px-4 pb-6">
        <FanChat />
      </div>
    </main>
  )
}
```

Create `src/components/fan/FanChat.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  'Which gate is least crowded?',
  'How long are food queues?',
  'Best exit route after the match?',
  'Where are the nearest toilets?',
]

export function FanChat() {
  const { zones, matchState } = useSimulationStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (question: string) => {
    if (!question.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: question }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    let accumulated = ''
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/fan-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          zones: zones.map(z => ({ name: z.name, density: z.density })),
          matchState,
          history: messages.slice(-6),
        })
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              accumulated += parsed.text
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: accumulated }
              ])
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <p className="text-blue-200 text-sm mb-4">How can I help you today?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-blue-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm'
            }`}>
              {m.content}
              {m.role === 'assistant' && !m.content && (
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white/5 border-t border-white/10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Ask about gates, food, exits..."
            disabled={streaming}
            className="flex-1 bg-white/10 text-white placeholder-blue-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### Day 6 — Weather layer + stadium selector

#### 6.1 Weather API route

Create `src/app/api/weather/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

const OWM_API = 'https://api.openweathermap.org/data/2.5/weather'

// Server-side cache per city — avoid hammering free tier
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city')
  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })

  const cached = cache.get(city)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ source: 'cache', weather: cached.data })
  }

  try {
    const url = `${OWM_API}?q=${encodeURIComponent(city)}&appid=${process.env.OWM_API_KEY}&units=metric`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

    if (!res.ok) throw new Error(`OWM: ${res.status}`)

    const raw = await res.json()

    const weather = {
      condition: mapCondition(raw.weather?.[0]?.main ?? ''),
      tempC: Math.round(raw.main?.temp ?? 20),
      humidity: raw.main?.humidity ?? 0,
      description: raw.weather?.[0]?.description ?? '',
      icon: raw.weather?.[0]?.icon ?? '',
    }

    cache.set(city, { data: weather, ts: Date.now() })
    return NextResponse.json({ source: 'live', weather })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

function mapCondition(main: string): string {
  const m = main.toLowerCase()
  if (m.includes('thunder')) return 'storm'
  if (m.includes('rain') || m.includes('drizzle')) return 'rain'
  if (m.includes('snow')) return 'snow'
  if (m.includes('clear')) return 'clear'
  return 'unknown'
}
```

#### 6.2 Weather param mapping

Create `src/lib/weatherParamMap.ts`:

```typescript
// Weather condition → zone density adjustments
// Rain/extreme heat cause shelter-seeking behaviour, shifting density from field to concourses

export const weatherParamMap: Record<string, Record<string, number>> = {
  rain: {
    concourse_lower: +0.12,
    concourse_main:  +0.12,
    concourse:       +0.12,
    field_level:     -0.08,
    upper_bowl:      -0.06,
    upper_tier:      -0.06,
    gate_north:      +0.04,  // covered gates fill up
    gate_south:      +0.04,
  },
  storm: {
    concourse_lower: +0.22,
    concourse_main:  +0.22,
    concourse:       +0.22,
    field_level:     -0.15,
    upper_bowl:      -0.12,
    upper_tier:      -0.12,
    gate_north:      +0.08,
    gate_south:      +0.08,
  },
  extreme_heat: {
    concessions_main: +0.20,  // water station rush
    concessions:      +0.20,
    vip_suites:       +0.08,  // air-conditioned zones fill
    vip:              +0.08,
    field_level:      -0.05,
  },
  clear: {},   // no adjustments for normal weather
  unknown: {},
  snow: {
    concourse_lower: +0.15,
    concourse_main:  +0.15,
    concourse:       +0.15,
    field_level:     -0.10,
    upper_bowl:      -0.08,
    upper_tier:      -0.08,
  },
}
```

#### 6.3 StadiumSelector + weather hook

Create `src/components/fan/StadiumSelector.tsx` and `src/components/ops/WeatherCard.tsx`. These both share a custom hook `useWeather`:

```typescript
// src/hooks/useWeather.ts
'use client'

import { useEffect } from 'react'
import { useSimulationStore } from '@/store/simulationStore'
import { STADIUMS } from '@/lib/stadiumData'

export function useWeather() {
  const { selectedStadiumId, setWeatherState, applyWeatherDelta } = useSimulationStore()

  useEffect(() => {
    const stadium = STADIUMS[selectedStadiumId]
    if (!stadium) return

    let cancelled = false

    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(stadium.owmCity)}`)
        if (!res.ok || cancelled) return
        const { weather } = await res.json()
        if (!weather || cancelled) return
        setWeatherState(weather)
        applyWeatherDelta(weather.condition)
      } catch (e) {
        console.warn('[useWeather]', e)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000) // every 10 min
    return () => { cancelled = true; clearInterval(interval) }
  }, [selectedStadiumId]) // eslint-disable-line react-hooks/exhaustive-deps
}
```

```tsx
// src/components/ops/WeatherCard.tsx
'use client'

import { useSimulationStore } from '@/store/simulationStore'
import { STADIUMS } from '@/lib/stadiumData'

export function WeatherCard() {
  const { weatherState, selectedStadiumId } = useSimulationStore()
  const stadium = STADIUMS[selectedStadiumId]

  if (!weatherState || !stadium) return null

  return (
    <div className="rounded-lg border px-4 py-3 text-sm flex items-center justify-between">
      <div>
        <span className="font-medium">{stadium.name}</span>
        <span className="text-gray-500 ml-2">{stadium.city}</span>
      </div>
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
        <span>{weatherState.tempC}°C</span>
        <span className="capitalize">{weatherState.description}</span>
        {(weatherState.condition === 'rain' || weatherState.condition === 'storm') && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Rain — crowd shifting to concourses
          </span>
        )}
        {weatherState.condition === 'extreme_heat' && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            Extreme heat — water station queues elevated
          </span>
        )}
      </div>
    </div>
  )
}
```

---

### Day 7 — Integration, polish, deploy check

This day is not for new features. It's for:

1. **Wire everything together** — ensure `useMatchPoller`, `useWeather`, and `useAlertStream` are all called from the ops dashboard root, and that `simulationStore` is properly initialised with your existing zone data.

2. **Seed the store from your existing engine** — the simulation store needs your existing zones as its initial state. In your current simulation's "run" callback, add:
   ```typescript
   import { useSimulationStore } from '@/store/simulationStore'
   // After your sim tick:
   useSimulationStore.getState().setZones(yourSimOutputZones)
   ```

3. **Navigation between modes** — add a top nav or landing page with two clear CTAs:
   - "Operations Center" → `/` (your existing dashboard, now with AI alerts and match banner)
   - "Fan Assistant" → `/fan`

4. **Environment variables** — double-check all are set on your deployment:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   OWM_API_KEY=...     # openweathermap.org — free tier is sufficient
   ```
   Note: `worldcup26.ir` requires no API key.

5. **Demo-proof the simulation** — if the WC match has ended (the tournament runs June 11–July 19), add a "Demo mode" button that replays a canned match event sequence: `goal → half_time → kick_off → goal → full_time`. This gives you full control during any live demo.

---

## 4. Environment setup

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY

# OpenWeatherMap — free tier: 60 calls/min, 1M calls/month
# Sign up: openweathermap.org/api
OWM_API_KEY=YOUR_OWM_KEY

# No key needed for worldcup26.ir
```

---

## 5. API reference summary

| API | Endpoint | Key required | Rate limit | Your use |
|---|---|---|---|---|
| worldcup26.ir | `GET /get/games` | No | Unknown (be polite — poll every 30s) | Live match state |
| OpenWeatherMap | `GET /data/2.5/weather?q={city}` | Yes (free) | 60/min, 1M/month | Stadium city weather |
| Anthropic Claude | `POST /v1/messages` (stream) | Yes | Model rate limits | Ops alerts, fan chat |

---

## 6. System prompt guide — tuning for your demo

The system prompts above are functional starting points. The most impactful tuning is in the ops alert prompt. Here's what to adjust depending on your demo scenario:

**For a packed half-time scenario:**
Add to the system prompt: `"It is currently half-time. Focus specifically on concourse congestion and concession queue management."`

**For a post-match egress:**
Add: `"The match has just ended. All 80,000+ fans are attempting to leave simultaneously. Prioritise gate egress routing and transit coordination."`

**For a rain emergency:**
Add: `"Heavy rain has started unexpectedly. Factor in the shelter-seeking behaviour this causes and alert the team proactively."`

The key principle: **the system prompt is your scenario context**. Swap it per use case to make the demo feel targeted, not generic.

---

## 7. One-sentence pitch (post-build)

> "A live GenAI-powered stadium operations system for FIFA World Cup 2026 — ingesting real match events, simulating crowd dynamics in real time, streaming AI safety alerts to ops teams, and simultaneously answering fan queries, all from a single simulation engine."

---

## 8. What not to do this week

| Temptation | Why to skip it |
|---|---|
| 3D stadium model (Three.js/Cesium) | 3–5 days of work for visual payoff that doesn't address the "GenAI-powered" requirement |
| More complex simulation physics | Your existing engine is sufficient; complexity that can't be explained in 30 seconds hurts your pitch |
| Transit/traffic APIs (TomTom, GTFS) | Brittle, rate-limited, hard to show in a live demo; weather API tells the same story more cleanly |
| WebSockets instead of SSE | Unnecessary complexity — SSE is the right tool for server-to-client streaming |
| Adding authentication | Not required for a hackathon live URL; adds friction for evaluators |
| Per-zone LLM calls | Too expensive and slow — one call with all zones as context is the right architecture |
