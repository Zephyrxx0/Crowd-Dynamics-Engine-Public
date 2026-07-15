import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";
import { presets } from "@/simulation/presets";

export interface DemoSlice {
  isDemo: boolean;
  setIsDemo: (value: boolean) => void;
  resetAll: () => void;
}

export const createDemoSlice: StateCreator<LiveStore, [], [], DemoSlice> = (set, get) => ({
  isDemo: false,
  setIsDemo: (value) => set({ isDemo: value }),
  resetAll: () => {
    get().setMatch(null);
    get().clearAlerts();
    get().initializeSim(presets.normal);
    get().setIsDemo(false);
  },
});
