import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";
import type { AlertEvent } from "@/types";

export interface AlertSlice {
  alerts: AlertEvent[];
  addAlert: (alert: AlertEvent) => void;
  clearAlerts: () => void;
}

export const createAlertSlice: StateCreator<LiveStore, [], [], AlertSlice> = (set) => ({
  alerts: [],
  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
  clearAlerts: () => set({ alerts: [] }),
});
