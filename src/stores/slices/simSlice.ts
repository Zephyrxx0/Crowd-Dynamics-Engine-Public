import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";
import type { SimulationInput } from "@/simulation/contracts/input.schema";

export interface SimSlice {
  v1ZoneData: SimulationInput | null;
  initialized: boolean;
  initializeSim: (data: SimulationInput) => void;
  reset: () => void;
}

export const createSimSlice: StateCreator<LiveStore, [], [], SimSlice> = (set) => ({
  v1ZoneData: null,
  initialized: false,
  initializeSim: (data) => set({ v1ZoneData: data, initialized: true }),
  reset: () => set({ v1ZoneData: null, initialized: false }),
});
