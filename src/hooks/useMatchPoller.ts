"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { type MatchState } from "@/types/match";

export interface PollerState {
  data: MatchState | null;
  error: string | null;
  isPolling: boolean;
  isRetrying: boolean;
}

const POLL_INTERVAL = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE = 1_000;

export function useMatchPoller(fetchFn: () => Promise<MatchState>) {
  const [state, setState] = useState<PollerState>({
    data: null,
    error: null,
    isPolling: true,
    isRetrying: false,
  });

  const retryCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

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

    try {
      const result = await fetchFnRef.current();
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
          error: "Match data unavailable — retrying...",
          isRetrying: false,
        }));
        retryCountRef.current = 0;
      }
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
    isVisibleRef.current = typeof document !== 'undefined' ? !document.hidden : true;
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
