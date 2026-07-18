import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import { createSimSlice, type SimSlice } from "./slices/simSlice";
import { createMatchSlice, type MatchSlice } from "./slices/matchSlice";
import { createWeatherSlice, type WeatherSlice } from "./slices/weatherSlice";
import { createAlertSlice, type AlertSlice } from "./slices/alertSlice";
import { createChatSlice, type ChatSlice } from "./slices/chatSlice";
import { createDemoSlice, type DemoSlice } from "./slices/demoSlice";
import { createI18nSlice, type I18nSlice } from "./slices/i18nSlice";

export type LiveStore = SimSlice & MatchSlice & WeatherSlice & AlertSlice & ChatSlice & DemoSlice & I18nSlice;

export const liveStore = createStore<LiveStore>()((...a) => ({
  ...createSimSlice(...a),
  ...createMatchSlice(...a),
  ...createWeatherSlice(...a),
  ...createAlertSlice(...a),
  ...createChatSlice(...a),
  ...createDemoSlice(...a),
  ...createI18nSlice(...a),
}));

export function useLiveStore<T>(selector: (state: LiveStore) => T): T {
  return useStore(liveStore, selector);
}
