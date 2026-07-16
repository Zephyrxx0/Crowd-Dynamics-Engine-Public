# Guide — Crowd Dynamics Engine

## What This Is

A live crowd/flow simulation sandbox for smart stadium operations. It simulates crowd dynamics in real time, coupling live match events with AI-generated safety alerts and a fan-facing chatbot.

## Prerequisites

- **Node.js 22+** (recent LTS recommended)
- **npm** (or pnpm)
- **Docker** (optional, for containerized deployment)

## Quickstart

```bash
# 1. Install dependencies
npm ci

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see below)

# 3. Start development server
npm run dev
```

The dev server opens at `http://localhost:3000` (Next.js) or run `npm run preview` for Vite at `http://localhost:4173`.

## API Keys

The app works without keys (simulation runs, UI, and 3D viz all function), but AI features require them:

| Variable | Service | How to Get |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Gemini (client-side risk reports) | [aistudio.google.com](https://aistudio.google.com/apikey) |
| `GEMINI_API_KEY` | Gemini (server-side alert gen) | Same key as above |
| `OWM_API_KEY` | OpenWeatherMap (stadium weather) | [openweathermap.org/api](https://openweathermap.org/api) — free tier |
| `WORLDCUP26_TOKEN` | worldcup26.ir (match feed) | Contact the API provider |

Set these in your `.env` file (or `.env.local` for Next.js). The `worldcup26.ir` match feed requires no key.

## Scripts

| Command | What It Does |
|---|---|
| `npm run dev` | Start Next.js dev server (port 3000) |
| `npm run build` | Build for production (Next.js standalone) |
| `npm test` | Run all tests (Vitest) |
| `npm run test:smoke` | Run focused smoke tests (UI form + presets) |
| `npm run docker:build` | Build Docker image |
| `npm run deploy:cloudrun` | Deploy to Google Cloud Run |

### Vite (Alternative Dev Path)

Although the default `dev` script uses Next.js, the project's primary build target is Vite. If you hit Next.js issues:

```bash
npx vite          # Vite dev server → http://localhost:5173
npm run build     # via Next.js (or use npx vite build for Vite)
npm run preview   # Vite preview → serves dist/
```

## Project Structure

```
src/
├── main.tsx              Vite entry point
├── App.tsx               Root app component
├── simulation/           Scenario / simulation engine
├── comparison/           Baseline vs candidate comparisons
├── export/               Result serialization
├── reporting/            Summary outputs
├── visualization/        3D (Three.js) and plots (d3)
├── components/           UI components (dashboard/ + fan/)
├── hooks/                React hooks (polling, streaming, weather)
├── stores/               Zustand state management
└── lib/                  AI clients, API proxies
```

## Docker

```bash
npm run docker:build
docker run -p 8080:8080 predictive-fan-flow
```

The container builds Next.js standalone and serves on port 8080.

## Cloud Run

Deployment runbook: `docs/deployment/cloud-run.md`

## Tests

```bash
npm test             # full suite
npm run test:smoke   # fast sanity checks
```

## Troubleshooting

- **`next dev` fails?** Use `npx vite` as the dev server instead.
- **Missing API key errors?** The app runs without keys — only AI alert/chat features will fail gracefully.
- **Port conflicts?** Next.js defaults to 3000; Vite to 5173. Set `PORT=4000 npm run dev` to change.
