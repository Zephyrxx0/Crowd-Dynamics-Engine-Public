import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePhaseTransitionWatcher } from "@/hooks/usePhaseTransitionWatcher";
import { applyPhaseTransitionDeltas } from "@/lib/api/phaseTransitions";

vi.mock("@/lib/api/phaseTransitions", () => ({
  applyPhaseTransitionDeltas: vi.fn((base, eventType, zoneDeltas) => ({ adjusted: true, eventType, zoneDeltas })),
}));

let phaseCallback: (phase: string | null) => void;
let scoreCallback: (score: string | null) => void;
let unsubPhase = vi.fn();
let unsubScore = vi.fn();
const mockInitializeSim = vi.fn();

vi.mock("@/stores/liveStore", () => ({
  liveStore: {
    subscribe: vi.fn((callback: any) => {
      const code = callback.toString();
      if (code.includes("phase = state.match?.phase")) {
        phaseCallback = callback;
        return unsubPhase;
      } else {
        scoreCallback = callback;
        return unsubScore;
      }
    }),
    getState: vi.fn(() => ({
      v1ZoneData: null,
      initializeSim: mockInitializeSim,
    })),
  },
}));

describe("usePhaseTransitionWatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips first subscription fire for phase", () => {
    renderHook(() => usePhaseTransitionWatcher());
    phaseCallback({ match: { phase: "first-half" } }, { match: { phase: null } });
    expect(mockInitializeSim).not.toHaveBeenCalled();
  });

  it("calls applyPhaseTransitionDeltas + initializeSim on first-half -> half-time transition", () => {
    renderHook(() => usePhaseTransitionWatcher());
    phaseCallback({ match: { phase: "first-half" } }, { match: { phase: null } }); // init
    phaseCallback({ match: { phase: "half-time" } }, { match: { phase: "first-half" } }); // transition
    
    expect(applyPhaseTransitionDeltas).toHaveBeenCalled();
    expect(mockInitializeSim).toHaveBeenCalled();
  });

  it("calls applyPhaseTransitionDeltas on second-half -> full-time transition", () => {
    renderHook(() => usePhaseTransitionWatcher());
    phaseCallback({ match: { phase: "second-half" } }, { match: { phase: null } });
    phaseCallback({ match: { phase: "full-time" } }, { match: { phase: "second-half" } });
    
    expect(applyPhaseTransitionDeltas).toHaveBeenCalled();
    expect(mockInitializeSim).toHaveBeenCalled();
  });

  it("does not trigger on same-phase non-transition", () => {
    renderHook(() => usePhaseTransitionWatcher());
    phaseCallback({ match: { phase: "first-half" } }, { match: { phase: null } });
    phaseCallback({ match: { phase: "first-half" } }, { match: { phase: "first-half" } });
    
    expect(mockInitializeSim).not.toHaveBeenCalled();
  });

  it("applies goal deltas when score changes (live mode, no currentDemoEvent)", () => {
    renderHook(() => usePhaseTransitionWatcher());
    scoreCallback({ match: { score: "0 - 0" } }, { match: { score: null } });
    scoreCallback({ match: { score: "1 - 0" } }, { match: { score: "0 - 0" } });
    
    expect(applyPhaseTransitionDeltas).toHaveBeenCalledWith(expect.anything(), "goal", [
      { zoneId: "north", deltaPercent: 20 },
      { zoneId: "south", deltaPercent: 20 },
      { zoneId: "east", deltaPercent: 20 },
    ]);
    expect(mockInitializeSim).toHaveBeenCalled();
  });

  it("skips when currentDemoEvent has zoneDeltas", () => {
    renderHook(() => usePhaseTransitionWatcher({ minute: 23, phase: "first-half", score: "1 - 0", eventType: "goal", zoneDeltas: [{zoneId: "north", deltaPercent: 20}] }));
    scoreCallback({ match: { score: "0 - 0" } }, { match: { score: null } });
    scoreCallback({ match: { score: "1 - 0" } }, { match: { score: "0 - 0" } });
    
    expect(applyPhaseTransitionDeltas).not.toHaveBeenCalled();
  });

  it("cleans up subscriptions on unmount", () => {
    const { unmount } = renderHook(() => usePhaseTransitionWatcher());
    unmount();
    expect(unsubPhase).toHaveBeenCalled();
    expect(unsubScore).toHaveBeenCalled();
  });
});
