import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDemoSequence } from "@/hooks/useDemoSequence";

const mockTimeline = [
  { minute: 0, phase: "first-half", score: "0 - 0", eventType: "kickoff" },
  { minute: 23, phase: "first-half", score: "1 - 0", eventType: "goal", zoneDeltas: [{ zoneId: "north", deltaPercent: 20 }] },
  { minute: 45, phase: "half-time", score: "1 - 0", eventType: "halftime" },
];

const mockSetMatch = vi.fn();
const mockInitializeSim = vi.fn();

vi.mock("@/stores/liveStore", () => ({
  useLiveStore: (selector: any) => selector({ setMatch: mockSetMatch, initializeSim: mockInitializeSim }),
  liveStore: { getState: () => ({ simConfig: null, initializeSim: mockInitializeSim }) },
}));

describe("useDemoSequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => mockTimeline }));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fetches /api/demo on mount when isActive=true", async () => {
    const { result } = renderHook(() => useDemoSequence(true, 5000));
    
    // fetch is called immediately
    expect(fetch).toHaveBeenCalledWith("/api/demo", { signal: expect.any(AbortSignal) });
    
    // Resolve the promise
    await act(async () => {
      await Promise.resolve(); // flush microtasks for fetch
      await Promise.resolve(); // flush for json
    });

    expect(result.current.currentEvent).not.toBeNull();
    expect(result.current.currentEvent?.eventType).toBe("kickoff");
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.totalEvents).toBe(3);
    
    expect(mockSetMatch).toHaveBeenCalledWith({
      score: "0 - 0",
      phase: "first-half",
      minute: 0,
      homeTeam: "Team A",
      awayTeam: "Team B"
    });
  });

  it("advances through timeline on interval", async () => {
    const { result } = renderHook(() => useDemoSequence(true, 5000));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Advance 5s to trigger interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentEvent?.eventType).toBe("goal");
    expect(mockInitializeSim).toHaveBeenCalled(); // Since goal has zoneDeltas
    
    // Advance 5s again
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentEvent?.eventType).toBe("halftime");
  });

  it("stops at end of timeline", async () => {
    const { result } = renderHook(() => useDemoSequence(true, 5000));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Advance to end
    act(() => {
      vi.advanceTimersByTime(10000); // 2 more steps
    });

    expect(result.current.currentIndex).toBe(2);
    expect(result.current.isPlaying).toBe(false);

    // Further time advancement doesn't change currentIndex
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.currentIndex).toBe(2);
  });

  it("returns {currentEvent, isPlaying, totalEvents, currentIndex}", async () => {
    const { result } = renderHook(() => useDemoSequence(true, 5000));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current).toEqual({
      currentEvent: mockTimeline[0],
      isPlaying: true,
      totalEvents: 3,
      currentIndex: 0,
    });
  });

  it("does not fetch when isActive=false", () => {
    const { result } = renderHook(() => useDemoSequence(false, 5000));
    
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.currentEvent).toBeNull();
  });

  it("ignores invalid demo timeline responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ eventType: "bad-event" }],
    } as Response);

    const { result } = renderHook(() => useDemoSequence(true, 5000));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.currentEvent).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    expect(mockSetMatch).not.toHaveBeenCalled();
  });

  it("aborts an in-flight timeline request on unmount", () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");
    const { unmount } = renderHook(() => useDemoSequence(true, 5000));

    unmount();

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });

  it("cleans up interval on unmount", async () => {
    const { unmount } = renderHook(() => useDemoSequence(true, 5000));
    
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    
    expect(mockSetMatch).toHaveBeenCalledTimes(1);
    
    unmount();
    
    // Advance time — should not advance/trigger setMatch
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    expect(mockSetMatch).toHaveBeenCalledTimes(1); // Still 1
  });
});
