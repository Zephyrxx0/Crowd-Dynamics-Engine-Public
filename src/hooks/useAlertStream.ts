"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { AlertEvent } from "@/types/alert";

const RECONNECT_BASE = 1000;
const RECONNECT_MAX = 8000;
/** How often the alert stream reconnects to poll for new AI crowd alerts (ms) */
const ALERT_RECONNECT_MS = 45_000;

export function useAlertStream() {
  const addAlert = useLiveStore((s) => s.addAlert);
  const match = useLiveStore((s) => s.match);
  const [isDisconnected, setIsDisconnected] = useState(false);
  
  const sourceRef = useRef<EventSource | null>(null);
  const retryRef = useRef(RECONNECT_BASE);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchRef = useRef(match);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const connect = useCallback(() => {
    clearTimers();
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }

    const { minute = 0, phase = "first-half", score = "0-0" } = matchRef.current ?? {};
    const url = `/api/alert?minute=${minute}&phase=${phase}&score=${score}`;

    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "alert":
            addAlert(data.alert);
            retryRef.current = RECONNECT_BASE;
            setIsDisconnected(false);
            break;
          case "error":
            console.warn("[alert-stream] Server error:", data.message);
            setIsDisconnected(true);
            break;
          case "complete":
            source.close();
            timeoutRef.current = setTimeout(connect, ALERT_RECONNECT_MS);
            break;
        }
      } catch (err) {
        console.warn("[alert-stream] Failed to parse message:", err);
      }
    };

    source.onerror = () => {
      source.close();
      setIsDisconnected(true);
      
      const delay = Math.min(retryRef.current, RECONNECT_MAX);
      retryRef.current = delay * 2;
      timeoutRef.current = setTimeout(connect, delay);
    };

    sourceRef.current = source;
  }, [addAlert, clearTimers]);

  useEffect(() => {
    connect();

    return () => {
      clearTimers();
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, [connect, clearTimers]);

  return { isDisconnected };
}
