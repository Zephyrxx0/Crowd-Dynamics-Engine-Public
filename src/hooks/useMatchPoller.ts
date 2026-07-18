"use client";

import { usePoller, type PollerState as BasePollerState } from "./usePoller";
import type { MatchState } from "@/types/match";

export type PollerState = BasePollerState<MatchState>;

export function useMatchPoller(fetchFn: () => Promise<MatchState>, enabled: boolean = true) {
  return usePoller(fetchFn, {
    enabled,
    intervalMs: 30_000,
    maxRetries: 3,
    retryBaseMs: 1_000,
    errorMessage: "Match data unavailable — retrying...",
  });
}
