import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";

export interface MatchSlice {
  match: {
    score: string | null;
    phase: string | null;
    minute: number | null;
    homeTeam: string | null;
    awayTeam: string | null;
  } | null;
  setMatch: (match: MatchSlice["match"]) => void;
}

export const createMatchSlice: StateCreator<LiveStore, [], [], MatchSlice> = (set) => ({
  match: null,
  setMatch: (match) => set({ match }),
});
