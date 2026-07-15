"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { WeatherData } from "@/types/weather";
import type { WeatherImpact } from "@/stores/slices/weatherSlice";

export interface WeatherPollerState {
  data: WeatherData | null;
  error: string | null;
  isPolling: boolean;
  isRetrying: boolean;
}

const POLL_INTERVAL = 600_000; // 10 minutes
const MAX_RETRIES = 3;
const RETRY_BASE = 1_000;

export function useWeather(
  fetchFn: () => Promise<WeatherData>,
  options?: { onImpactChange?: (impact: WeatherImpact) => void }
): WeatherPollerState {
  const [state, setState] = useState<WeatherPollerState>({
    data: null,
    error: null,
    isPolling: true,
    isRetrying: false,
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const retryCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  const isFetchingRef = useRef(false);
  const onImpactChangeRef = useRef(options?.onImpactChange);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    onImpactChangeRef.current = options?.onImpactChange;
  }, [options?.onImpactChange]);

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const doFetch = useCallback(async () => {
    if (!isVisibleRef.current) return;
    // Guard against overlapping fetches on rapid visibility toggle
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const result = await fetchFnRef.current();

      // Impact change detection — compare against latest state via ref
      const prevImpact = stateRef.current.data?.impact;
      if (prevImpact !== undefined && result.impact !== prevImpact) {
        onImpactChangeRef.current?.(result.impact);
      } else if (prevImpact === undefined && result.impact !== "none") {
        // First fetch with non-none impact also triggers callback
        onImpactChangeRef.current?.(result.impact);
      }

      setState((prev) => ({
        ...prev,
        data: result,
        error: null,
        isRetrying: false,
      }));
      retryCountRef.current = 0;
    } catch (err) {
      retryCountRef.current += 1;
      const currentRetry = retryCountRef.current;

      if (currentRetry <= MAX_RETRIES) {
        setState((prev) => ({ ...prev, isRetrying: true }));
        const delay = RETRY_BASE * Math.pow(2, currentRetry - 1);
        retryTimerRef.current = setTimeout(doFetch, delay);
      } else {
        setState((prev) => ({
          ...prev,
          error: "Weather data unavailable — retrying...",
          isRetrying: false,
        }));
        retryCountRef.current = 0;
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        setState((prev) => ({ ...prev, isPolling: true }));
        clearTimers(); // Ensure no duplicates
        doFetch(); // Fetch immediately on resume
        intervalRef.current = setInterval(doFetch, POLL_INTERVAL);
      } else {
        setState((prev) => ({ ...prev, isPolling: false }));
        clearTimers(); // Stop polling while hidden
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial start
    isVisibleRef.current =
      typeof document !== "undefined" ? !document.hidden : true;
    if (isVisibleRef.current) {
      setState((prev) => ({ ...prev, isPolling: true }));
      doFetch();
      intervalRef.current = setInterval(doFetch, POLL_INTERVAL);
    } else {
      setState((prev) => ({ ...prev, isPolling: false }));
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimers();
    };
  }, [doFetch, clearTimers]);

  return state;
}
