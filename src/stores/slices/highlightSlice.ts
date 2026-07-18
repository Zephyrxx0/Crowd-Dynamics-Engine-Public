import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";

export interface HighlightSlice {
  highlightedZone: string | null;
  setHighlightedZone: (zoneId: string | null) => void;
}

export const createHighlightSlice: StateCreator<LiveStore, [], [], HighlightSlice> = (set) => ({
  highlightedZone: null,
  setHighlightedZone: (zoneId) => set({ highlightedZone: zoneId }),
});
