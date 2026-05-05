# Crowd Dynamics Engine (Public)

A web-based crowd / flow simulation sandbox for running scenarios, comparing outcomes, and exporting results. This repository contains the frontend app (React + TypeScript) built with **Vite**, with optional **Next.js** scripts present for experimentation/alternate builds.

## What’s in this repo

- **Vite + React + TypeScript** application (`npm run dev`, `npm run build`)
- UI + visualization stack includes **Three.js / @react-three/fiber**, **d3**, Tailwind, and component utilities
- Test suite powered by **Vitest**
- Containerized static deployment: **build with Vite → serve with Nginx** (see `Dockerfile`, `nginx.conf`)
- Cloud Run deployment runbook in `docs/deployment/cloud-run.md`

## Quickstart (local)

### Prerequisites
- Node.js (the Docker build uses Node 22; a recent Node LTS should work best)
- npm

### Install
```bash
npm ci
```

### Run (Vite)
```bash
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

## Tests

Run all tests:
```bash
npm test
```

Run the smoke tests (focused UI + preset checks):
```bash
npm run test:smoke
```

## Deployment

### Docker (local)
Build the container:
```bash
npm run docker:build
```

This builds the Vite app and serves it via Nginx.

### Google Cloud Run
A step-by-step runbook is available here:

- `docs/deployment/cloud-run.md`

It covers building/tagging/pushing the image and deploying it, plus an acceptance checklist (SPA refresh, run/compare/export flow, and a `/healthz` check).

## Project structure (high level)

From the repository layout, the source tree is organized around major product areas:

- `src/main.tsx` — Vite entry point
- `src/App.tsx` — main app component
- `src/simulation/` — scenario/simulation domain
- `src/comparison/` — comparing baseline vs candidate runs
- `src/export/` — export/serialization of results
- `src/reporting/` — reporting/summary outputs
- `src/visualization/` — visuals/3D/plots
- `src/components/`, `src/hooks/`, `src/lib/` — shared UI, hooks, and utilities

## Configuration

- `.env.example` — example environment variables
- `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `vitest.config.ts` — tooling configuration

## Notes

- The npm scripts include optional Next.js commands (`dev:next`, `build:next`, `start:next`), but the container/deployment flow is currently oriented around the **Vite static build** (`dist/`) served by Nginx.

## License

If this project has a specific license, add it here (e.g., MIT/Apache-2.0) and include a `LICENSE` file at the repository root.
