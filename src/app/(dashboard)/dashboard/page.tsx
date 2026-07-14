"use client";

import { useEffect, useCallback } from "react";
import { useMatchPoller } from "@/hooks/useMatchPoller";
import { useLiveStore } from "@/stores/liveStore";
import { presets } from "@/simulation/presets";

export default function DashboardPage() {
  const initializeSim = useLiveStore((s) => s.initializeSim);
  const initialized = useLiveStore((s) => s.initialized);
  const setMatch = useLiveStore((s) => s.setMatch);

  const fetchMatch = useCallback(async () => {
    const res = await fetch("/api/match");
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const json = await res.json();
    setMatch(json.match); // Update store with live match
    return json.match;
  }, [setMatch]);

  useMatchPoller(fetchMatch);

  useEffect(() => {
    if (!initialized) {
      initializeSim(presets.normal);
    }
  }, [initialized, initializeSim]);

  return (
    <main>
      {/* Dashboard content area — Phase 15+ components render here */}
    </main>
  );
}
