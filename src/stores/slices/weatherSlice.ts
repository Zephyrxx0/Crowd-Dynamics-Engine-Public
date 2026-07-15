import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";

export type WeatherImpact = "none" | "rain" | "heat" | "storm";

export interface WeatherSlice {
  weather: {
    temperature: number | null;
    conditions: string | null;
    humidity: number | null;
    windSpeed: number | null;
    impact: WeatherImpact;
  } | null;
  setWeather: (weather: WeatherSlice["weather"]) => void;
  lastFetchTime: number | null;
  setLastFetchTime: (time: number | null) => void;
}

export const createWeatherSlice: StateCreator<LiveStore, [], [], WeatherSlice> = (set) => ({
  weather: null,
  setWeather: (weather) => set({ weather }),
  lastFetchTime: null,
  setLastFetchTime: (time) => set({ lastFetchTime: time }),
});

