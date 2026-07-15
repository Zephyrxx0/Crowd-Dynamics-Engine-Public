"use client";

import { useEffect, useCallback } from "react";
import { useMatchPoller } from "@/hooks/useMatchPoller";
import { useWeather } from "@/hooks/useWeather";
import { useLiveStore } from "@/stores/liveStore";
import { applyWeatherAdjustment } from "@/lib/api/weather";
import { presets } from "@/simulation/presets";
import type { WeatherImpact } from "@/stores/slices/weatherSlice";
import type { WeatherData } from "@/types/weather";
import { useDemoSequence } from "@/hooks/useDemoSequence";
import { usePhaseTransitionWatcher } from "@/hooks/usePhaseTransitionWatcher";
import { useAlertStream } from "@/hooks/useAlertStream";
import { AlertFeed } from "@/components/dashboard/AlertFeed";

export default function DashboardPage() {
  const initializeSim = useLiveStore((s) => s.initializeSim);
  const initialized = useLiveStore((s) => s.initialized);
  const setMatch = useLiveStore((s) => s.setMatch);
  const setWeather = useLiveStore((s) => s.setWeather);
  const setLastFetchTime = useLiveStore((s) => s.setLastFetchTime);
  const isDemo = useLiveStore((s) => s.isDemo);

  const fetchMatch = useCallback(async () => {
    const res = await fetch("/api/match");
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`);
    const json = await res.json();
    setMatch(json.match); // Update store with live match
    return json.match;
  }, [setMatch]);

  const fetchWeather = useCallback(async (): Promise<WeatherData> => {
    const res = await fetch("/api/weather");
    if (!res.ok) throw new Error(`Weather poll failed: ${res.status}`);
    const json = await res.json();
    const weatherData = json as WeatherData;
    setWeather(weatherData);
    setLastFetchTime(Date.now());
    return weatherData;
  }, [setWeather, setLastFetchTime]);

  const onImpactChange = useCallback(
    (impact: WeatherImpact) => {
      const adjusted = applyWeatherAdjustment(presets.normal, impact);
      initializeSim(adjusted);
    },
    [initializeSim]
  );

  useMatchPoller(fetchMatch, !isDemo);
  useWeather(fetchWeather, { onImpactChange });
  const { currentEvent: demoEvent } = useDemoSequence(isDemo);
  const { isDisconnected } = useAlertStream();
  usePhaseTransitionWatcher(demoEvent);

  useEffect(() => {
    if (!initialized) {
      initializeSim(presets.normal);
    }
  }, [initialized, initializeSim]);

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto">
      <AlertFeed isDisconnected={isDisconnected} />
    </div>
  );
}
