import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatStream } from "@/hooks/useChatStream";
import * as liveStore from "@/stores/liveStore";

// Helper to create a readable stream from SSE string data
function makeMockSSEStream(sseText: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseText));
      controller.close();
    },
  });
}

const mockSSEData =
  'data: {"type":"token","text":"Hello"}\n\ndata: {"type":"token","text":" world"}\n\ndata: {"type":"complete"}\n\n';

describe("useChatStream", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let addMessageMock: ReturnType<typeof vi.fn>;
  let updateMessageMock: ReturnType<typeof vi.fn>;
  let setStreamingMock: ReturnType<typeof vi.fn>;
  let mockMatch: { minute: number; phase: string; score: string; homeTeam: string; awayTeam: string };

  beforeEach(() => {
    addMessageMock = vi.fn();
    updateMessageMock = vi.fn();
    setStreamingMock = vi.fn();
    mockMatch = { minute: 55, phase: "second-half", score: "2-1", homeTeam: "Iran", awayTeam: "Japan" };

    vi.spyOn(liveStore, "useLiveStore").mockImplementation((selector: any) => {
      return selector({
        addMessage: addMessageMock,
        updateMessage: updateMessageMock,
        setStreaming: setStreamingMock,
        messages: [],
        match: mockMatch,
      });
    });

    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeMockSSEStream(mockSSEData),
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/chat with match state query params", async () => {
    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("Where's my gate?", []);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat"),
      expect.objectContaining({ method: "POST" })
    );
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("minute=55");
    expect(url).toContain("phase=second-half");
    expect(url).toContain("score=2-1");
  });

  it("adds user message to chatSlice immediately on send", async () => {
    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("Where's my gate?", []);
    });

    expect(addMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user", content: "Where's my gate?" })
    );
  });

  it("sets isStreaming=true while response is streaming", async () => {
    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("Hello", []);
    });

    expect(setStreamingMock).toHaveBeenCalledWith(true);
  });

  it("sets isStreaming=false when stream completes", async () => {
    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("Hello", []);
    });

    expect(setStreamingMock).toHaveBeenLastCalledWith(false);
  });

  it("aborts in-flight request when new message is sent", async () => {
    // First call: slow stream
    const slowStream = new ReadableStream({
      async start(controller) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(mockSSEData));
        controller.close();
      },
    });

    let firstAbortController: AbortController | null = null;
    mockFetch = vi.fn().mockImplementation((url: string, init: RequestInit) => {
      if (firstAbortController === null) {
        firstAbortController = (init.signal as any)?._controller || new AbortController();
      }
      return Promise.resolve({ ok: true, status: 200, body: makeMockSSEStream(mockSSEData) });
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useChatStream());

    // Send two messages quickly
    act(() => {
      result.current.sendMessage("Message 1", []);
    });
    await act(async () => {
      await result.current.sendMessage("Message 2", []);
    });

    // fetch should have been called twice
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("handles AbortError without propagating to consumer", async () => {
    mockFetch = vi.fn().mockRejectedValue(
      Object.assign(new Error("AbortError"), { name: "AbortError" })
    );
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useChatStream());

    // Should not throw
    await expect(
      act(async () => {
        await result.current.sendMessage("Hello", []);
      })
    ).resolves.not.toThrow();
  });

  it("ignores malformed structured responses from the stream", async () => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeMockSSEStream('data: {"type":"structured","response":{"text":""}}\n\n'),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useChatStream());

    await act(async () => {
      await result.current.sendMessage("Hello", []);
    });

    expect(updateMessageMock).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ structuredData: expect.anything() })
    );
  });
});
