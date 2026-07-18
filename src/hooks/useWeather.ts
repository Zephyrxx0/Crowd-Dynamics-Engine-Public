"use client";

import { useCallback } from "react";
import { usePoller, type PollerState } from "./usePoller";
import type { WeatherImpact } from "@/stores/slices/weatherSlice";
import type { WeatherData } from "@/types/weather";

export type WeatherPollerState = PollerState<WeatherData>;

export function useWeather(
  fetchFn: () => Promise<WeatherData>,
  options?: { onImpactChange?: (impact: WeatherImpact) => void }
): WeatherPollerState {
  const onSuccess = useCallback(
    (result: WeatherData, prev: WeatherData | null) => {
      const prevImpact = prev?.impact;
      if (prevImpact !== undefined && result.impact !== prevImpact) {
        options?.onImpactChange?.(result.impact);
      } else if (prevImpact === undefined && result.impact !== "none") {
        options?.onImpactChange?.(result.impact);
      }
    },
    [options?.onImpactChange]
  );

  return usePoller(fetchFn, {
    intervalMs: 600_000,
    maxRetries: 3,
    retryBaseMs: 1_000,
    onSuccess,
    errorMessage: "Weather data unavailable — retrying...",
  });
}
