"use client";

import { useEffect, useRef } from "react";
import { liveStore } from "@/stores/liveStore";
import { applyPhaseTransitionDeltas } from "@/lib/api/phaseTransitions";
import type { DemoEvent } from "@/types/demo";
import { presets } from "@/simulation/presets";

export function usePhaseTransitionWatcher(currentDemoEvent?: DemoEvent | null) {
  const previousPhaseRef = useRef<string | null>(null);
  const previousScoreRef = useRef<string | null>(null);
  const currentDemoEventRef = useRef(currentDemoEvent);

  useEffect(() => {
    currentDemoEventRef.current = currentDemoEvent;
  }, [currentDemoEvent]);

  useEffect(() => {
    const unsubPhase = liveStore.subscribe(
      (state, prevState) => {
        const phase = state.match?.phase ?? null;
        const prevPhase = prevState.match?.phase ?? null;
        
        if (phase !== prevPhase) {
          if (!previousPhaseRef.current) {
            previousPhaseRef.current = phase;
            return;
          }

          if (phase && previousPhaseRef.current && phase !== previousPhaseRef.current) {
            if (currentDemoEventRef.current?.zoneDeltas) {
              previousPhaseRef.current = phase;
              return;
            }

            let eventType: string;
            if (phase === "half-time") eventType = "halftime";
            else if (phase === "full-time") eventType = "full-time";
            else if (previousPhaseRef.current === "first-half" && phase === "second-half") eventType = "second-half-start";
            else {
              previousPhaseRef.current = phase;
              return;
            }

            const currentState = liveStore.getState();
            const baseInput = currentState.v1ZoneData ?? presets.normal;
            const adjusted = applyPhaseTransitionDeltas(baseInput, eventType);
            currentState.initializeSim(adjusted);

            previousPhaseRef.current = phase;
          }
        }
      }
    );

    const unsubScore = liveStore.subscribe(
      (state, prevState) => {
        const score = state.match?.score ?? null;
        const prevScore = prevState.match?.score ?? null;
        
        if (score !== prevScore) {
          if (!previousScoreRef.current) {
            previousScoreRef.current = score;
            return;
          }

          if (score && previousScoreRef.current && score !== previousScoreRef.current) {
            if (currentDemoEventRef.current?.zoneDeltas) {
              previousScoreRef.current = score;
              return;
            }

            const currentState = liveStore.getState();
            const baseInput = currentState.v1ZoneData ?? presets.normal;
            const adjusted = applyPhaseTransitionDeltas(baseInput, "goal", [
              { zoneId: "north", deltaPercent: 20 },
              { zoneId: "south", deltaPercent: 20 },
              { zoneId: "east", deltaPercent: 20 },
            ]);
            currentState.initializeSim(adjusted);

            previousScoreRef.current = score;
          }
        }
      }
    );

    return () => {
      unsubPhase();
      unsubScore();
    };
  }, []);
}
