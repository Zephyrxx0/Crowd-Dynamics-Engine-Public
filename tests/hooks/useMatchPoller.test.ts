import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMatchPoller } from "@/hooks/useMatchPoller";
import { type MatchState } from "@/types/match";

const mockMatch: MatchState = {
  score: "3 - 1",
  phase: "second-half",
  minute: 67,
  homeTeam: "Brazil",
  awayTeam: "Argentina",
};

describe("useMatchPoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("Test 1: Calls fetchFn on mount and returns correct types", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockMatch);
    
    const { result } = renderHook(() => useMatchPoller(fetchFn));
    
    expect(result.current.isPolling).toBe(true);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // initial tick
    });
    
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockMatch);
  });

  it("Test 2: Calls fetchFn repeatedly at 30s interval", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockMatch);
    renderHook(() => useMatchPoller(fetchFn));
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("Test 3 & 4: Retries 3 times with exponential backoff and sets error state", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useMatchPoller(fetchFn));
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // Initial fetch
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(true);
    expect(result.current.error).toBeNull();
    
    // 1st retry (1s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result.current.isRetrying).toBe(true);
    
    // 2nd retry (2s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(result.current.isRetrying).toBe(true);
    
    // 3rd retry (4s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(4);
    
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.error).toBe("Match data unavailable — retrying...");
  });

  it("Test 5: Preserves last-known data after retry exhaustion", async () => {
    const fetchFn = vi.fn();
    fetchFn.mockResolvedValueOnce(mockMatch); // First success
    fetchFn.mockRejectedValue(new Error("Network error")); // Subsequent fail
    
    const { result } = renderHook(() => useMatchPoller(fetchFn));
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // initial fetch success
    });
    expect(result.current.data).toEqual(mockMatch);
    
    // Next interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    
    // Failures start
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000); // 1st retry
      await vi.advanceTimersByTimeAsync(2_000); // 2nd retry
      await vi.advanceTimersByTimeAsync(4_000); // 3rd retry
    });
    
    expect(result.current.error).toBe("Match data unavailable — retrying...");
    expect(result.current.data).toEqual(mockMatch); // Data preserved
  });

  it("Test 6 & 7: Pauses polling when document.hidden is true, resumes when false", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockMatch);
    
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    
    const { result } = renderHook(() => useMatchPoller(fetchFn));
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    
    // Hide document
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    expect(result.current.isPolling).toBe(false);
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000); // Advance long time
    });
    
    expect(fetchFn).toHaveBeenCalledTimes(1); // Should not have fetched
    
    // Show document
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    expect(result.current.isPolling).toBe(true);
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0); // Immediate fetch on resume
    });
    
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("Test 8: Cleans up timers on unmount", async () => {
    const fetchFn = vi.fn().mockResolvedValue(mockMatch);
    const { unmount } = renderHook(() => useMatchPoller(fetchFn));
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    
    unmount();
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    
    // fetchFn should only be called once, not during the 60s after unmount
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
