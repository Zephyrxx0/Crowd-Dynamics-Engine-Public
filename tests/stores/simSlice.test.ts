import { describe, it, expect, beforeEach } from "vitest";
import { liveStore } from "@/stores/liveStore";
import { presets } from "@/simulation/presets";

describe("simSlice", () => {
  beforeEach(() => {
    // Reset store before each test
    liveStore.getState().reset();
  });

  it("initial state has null zone data and initialized false", () => {
    const state = liveStore.getState();
    expect(state.v1ZoneData).toBeNull();
    expect(state.initialized).toBe(false);
  });

  it("initializes with normal preset data", () => {
    liveStore.getState().initializeSim(presets.normal);
    const state = liveStore.getState();
    expect(state.v1ZoneData).toEqual(presets.normal);
    expect(state.initialized).toBe(true);
  });

  it("reset clears zone data", () => {
    liveStore.getState().initializeSim(presets.normal);
    liveStore.getState().reset();
    const state = liveStore.getState();
    expect(state.v1ZoneData).toBeNull();
    expect(state.initialized).toBe(false);
  });
});
