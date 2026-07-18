# 🏟️ Crowd Dynamics Engine

A real-time, web-based crowd flow simulation and stadium management sandbox designed for the **FIFA World Cup 2026**. This project leverages generative AI to provide intelligent navigation, real-time alerts, and crowd management for fans and organizers. 

Built with **Next.js** (React + TypeScript) and **Gemini 2.5 Flash**.

## ✨ Core Features

### 1. 🤖 GenAI Stadium Assistant (Fan View)
A multilingual, real-time AI assistant for fans in the stadium.
- **Context-Aware Routing**: Gemini knows the current match minute, score, and exact crowd capacities across all zones to provide safe, low-density routing advice.
- **Accessibility Routing**: Automatically recommends step-free pathways and accessible van transfers for mobility-impaired users.
- **Multilingual (i18n)**: Switch between English, Spanish, and French seamlessly.

### 2. 🚨 Operational Intelligence (Command Center)
A comprehensive real-time dashboard for venue staff and organizers.
- **Live Match Polling**: Tracks the match phase (first half, halftime, etc.) and auto-adjusts crowd behavior.
- **Weather Integration**: Syncs with live weather (rain, heatwaves) to adjust fan arrival curves and throughput delays.
- **AI Alert Stream**: A persistent Server-Sent Events (SSE) connection that continuously analyzes the simulation state and pushes severity-graded, actionable alerts to operators when crowd crush risks are detected.

### 3. 👥 Volunteer Portal (Mobile First)
A dedicated interface for on-the-ground venue volunteers.
- **Targeted Zone Telemetry**: Volunteers only see the capacity and flow stats relevant to their specific assigned zone.
- **Access Control Mockup**: A simulated digital scanner for validating tickets/credentials.
- **Filtered Alerts**: Volunteers receive alerts tailored exclusively to their zone.

### 4. 🧮 Deterministic Simulation Engine
- **Physics-Based Crowd Modeling**: Simulates thousands of fans moving through gates and zones across different match phases.
- **Sustainability Tracking**: Computes live CO₂ emissions saved based on the ratio of public transit users vs. private car users.

## 🚀 Quickstart

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **State Management**: Zustand
- **GenAI**: Google Gemini 2.5 Flash (via `@google/genai`)
- **Animation**: GSAP, Framer Motion (via UI components)
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library (240+ passing tests!)

## 📂 Project Structure

- `src/app/` — Next.js App Router (Dashboard, Simulate, Compare, Volunteer, API Routes)
- `src/components/` — Shared UI components (Fan, Dashboard, Volunteer)
- `src/simulation/` — The deterministic simulation engine and invariant checks
- `src/stores/` — Zustand slices for state management
- `src/hooks/` — Custom React hooks (streaming, polling)
- `src/lib/` — API wrappers and utilities
- `tests/` — Comprehensive unit and UI test suite
