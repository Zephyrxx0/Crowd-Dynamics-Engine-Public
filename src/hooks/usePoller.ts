"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UsePollerOptions<T> {
  enabled?: boolean;
  intervalMs: number;
  maxRetries?: number;
  retryBaseMs?: number;
  onSuccess?: (result: T, prev: T | null) => void;
  errorMessage?: string;
}

export interface PollerState<T> {
  data: T | null;
  error: string | null;
  isPolling: boolean;
  isRetrying: boolean;
}

export function usePoller<T>(
  fetchFn: () => Promise<T>,
  options: UsePollerOptions<T>
): PollerState<T> {
  const {
    enabled = true,
    intervalMs,
    maxRetries = 3,
    retryBaseMs = 1_000,
    onSuccess,
    errorMessage = "Data unavailable — retrying...",
  } = options;

  const [state, setState] = useState<PollerState<T>>({
    data: null,
    error: null,
    isPolling: enabled !== false,
    isRetrying: false,
  });

  const stateRef = useRef(state);
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const enabledRef = useRef(enabled !== false);
  const maxRetriesRef = useRef(maxRetries);
  const retryBaseMsRef = useRef(retryBaseMs);
  const errorMessageRef = useRef(errorMessage);
  const retryCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(true);
  const isFetchingRef = useRef(false);

  enabledRef.current = enabled !== false;
  maxRetriesRef.current = maxRetries;
  retryBaseMsRef.current = retryBaseMs;
  errorMessageRef.current = errorMessage;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

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
    if (!isVisibleRef.current || !enabledRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;
    try {
      const result = await fetchFnRef.current();
      onSuccessRef.current?.(result, stateRef.current.data);
      setState((prev) => ({
        ...prev,
        data: result,
        error: null,
        isRetrying: false,
      }));
      retryCountRef.current = 0;
    } catch {
      retryCountRef.current += 1;
      const currentRetry = retryCountRef.current;

      if (currentRetry <= maxRetriesRef.current) {
        setState((prev) => ({ ...prev, isRetrying: true }));
        retryTimerRef.current = setTimeout(
          doFetch,
          retryBaseMsRef.current * Math.pow(2, currentRetry - 1)
        );
      } else {
        setState((prev) => ({
          ...prev,
          error: errorMessageRef.current,
          isRetrying: false,
        }));
        retryCountRef.current = 0;
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (enabled === false) {
      clearTimers();
      setState((prev) => ({ ...prev, isPolling: false }));
      return;
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        setState((prev) => ({ ...prev, isPolling: true }));
        clearTimers();
        doFetch();
        intervalRef.current = setInterval(doFetch, intervalMs);
      } else {
        setState((prev) => ({ ...prev, isPolling: false }));
        clearTimers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    isVisibleRef.current = typeof document !== "undefined" ? !document.hidden : true;
    if (isVisibleRef.current) {
      setState((prev) => ({ ...prev, isPolling: true }));
      doFetch();
      intervalRef.current = setInterval(doFetch, intervalMs);
    } else {
      setState((prev) => ({ ...prev, isPolling: false }));
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimers();
    };
  }, [clearTimers, doFetch, enabled, intervalMs]);

  return state;
}
