"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { DemoEventSequenceSchema, type DemoEvent } from "@/types/demo";
import { useLiveStore, liveStore } from "@/stores/liveStore";
import { applyPhaseTransitionDeltas } from "@/lib/api/phaseTransitions";
import { presets } from "@/simulation/presets";

export function useDemoSequence(isActive: boolean, advanceIntervalMs: number = 5000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineVersion, setTimelineVersion] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const timelineRef = useRef<DemoEvent[] | null>(null);
  
  const setMatch = useLiveStore((s) => s.setMatch);

  // Fetch timeline on activate
  useEffect(() => {
    if (!isActive || timelineRef.current) return;

    const controller = new AbortController();
    let ignore = false;

    fetch("/api/demo", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Demo timeline unavailable: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const parsed = DemoEventSequenceSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error("Invalid demo timeline response");
        }
        if (ignore) return;

        timelineRef.current = parsed.data;
        setCurrentIndex(0);
        setTimelineVersion((version) => version + 1);
        setIsPlaying(true);
      })
      .catch((error) => {
        if (ignore) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        timelineRef.current = null;
        setIsPlaying(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [isActive]);

  const advanceTimeline = useCallback(() => {
    if (!isVisibleRef.current) return;
    
    setCurrentIndex((prev) => {
      const currentTimeline = timelineRef.current;
      if (!currentTimeline) return prev;
      
      const nextIndex = prev + 1;
      if (nextIndex >= currentTimeline.length) {
        return prev; // Stay at last index
      }
      return nextIndex;
    });
  }, []);

  // Stop playing when we reach the end
  useEffect(() => {
    const timeline = timelineRef.current;
    if (timeline && currentIndex >= timeline.length - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentIndex, isPlaying, timelineVersion]);

  // Interval management
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    isVisibleRef.current = typeof document !== 'undefined' ? !document.hidden : true;

    if (isActive && isPlaying) {
      intervalRef.current = setInterval(advanceTimeline, advanceIntervalMs);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPlaying, advanceIntervalMs, advanceTimeline]);

  // Apply event effect
  useEffect(() => {
    const timeline = timelineRef.current;
    if (timeline && currentIndex >= 0 && currentIndex < timeline.length) {
      const event = timeline[currentIndex];
      
      // 1. Update Match State
      setMatch({
        score: event.score,
        phase: event.phase,
        minute: event.minute,
        homeTeam: "Team A",
        awayTeam: "Team B",
      });

      // 2. Apply Zone Deltas if present (LIVE-02)
      if (
        (event.zoneDeltas && event.zoneDeltas.length > 0) ||
        event.eventType === "halftime" ||
        event.eventType === "full-time"
      ) {
        const state = liveStore.getState();
        const baseInput = state.simConfig ?? presets.normal;
        
        const adjusted = applyPhaseTransitionDeltas(baseInput, event.eventType, event.zoneDeltas);
        state.initializeSim(adjusted);
      }
    }
  }, [currentIndex, setMatch, timelineVersion]);

  return {
    currentEvent: timelineRef.current?.[currentIndex] ?? null,
    isPlaying,
    totalEvents: timelineRef.current?.length ?? 0,
    currentIndex,
  };
}
