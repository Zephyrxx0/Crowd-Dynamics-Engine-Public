import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";
import { type MatchState } from "@/types/match";

export interface MatchSlice {
  match: MatchState | null;
  upcomingMatch: { homeTeam: string; awayTeam: string; localDate: string } | null;
  setMatch: (match: MatchState | null, upcomingMatch?: { homeTeam: string; awayTeam: string; localDate: string } | null) => void;
}

export const createMatchSlice: StateCreator<LiveStore, [], [], MatchSlice> = (set) => ({
  match: null,
  upcomingMatch: null,
  setMatch: (match, upcomingMatch = null) => set({ match, upcomingMatch }),
});
