import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup as cleanupDOM } from "@testing-library/react";
import { ChatInterface } from "@/components/fan/ChatInterface";
import * as liveStore from "@/stores/liveStore";
import * as useChatStreamModule from "@/hooks/useChatStream";
import type { ChatMessage } from "@/types/chat";

vi.mock("@/hooks/useChatStream", () => ({
  useChatStream: vi.fn(),
}));

vi.mock("@/components/fan/ChatInput", () => ({
  ChatInput: ({ onSend, disabled }: { onSend: (t: string) => void; disabled: boolean }) => (
    <button data-testid="chat-input" disabled={disabled} onClick={() => onSend("test message")}>
      Send
    </button>
  ),
}));

vi.mock("@/components/fan/QuickChips", () => ({
  QuickChips: ({ onSelect }: { onSelect: (q: string) => void }) => (
    <button data-testid="quick-chip" onClick={() => onSelect("Where's my gate?")}>
      Where&apos;s my gate?
    </button>
  ),
}));

vi.mock("@/components/fan/ChatMessage", () => ({
  ChatMessage: ({ message }: { message: ChatMessage }) => (
    <div data-testid="chat-message">{message.content}</div>
  ),
}));

describe("ChatInterface", () => {
  let sendMessageMock: ReturnType<typeof vi.fn>;
  let cancelStreamMock: ReturnType<typeof vi.fn>;
  let clearMessagesMock: ReturnType<typeof vi.fn>;

  const setupStore = (messages: ChatMessage[] = [], isStreaming = false) => {
    clearMessagesMock = vi.fn();
    vi.spyOn(liveStore, "useLiveStore").mockImplementation((selector: any) => {
      return selector({
        messages,
        isStreaming,
        clearMessages: clearMessagesMock,
      });
    });
  };

  beforeEach(() => {
    sendMessageMock = vi.fn();
    cancelStreamMock = vi.fn();
    (useChatStreamModule.useChatStream as ReturnType<typeof vi.fn>).mockReturnValue({
      sendMessage: sendMessageMock,
      cancelStream: cancelStreamMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupDOM();
  });

  it("shows welcome heading when messages is empty", () => {
    setupStore([]);
    render(<ChatInterface />);
    // Both h1 ("Stadium Assistant") and h2 ("Welcome to the Stadium Assistant") may match
    const matches = screen.getAllByText(/Stadium Assistant/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows quick chips when no messages exist", () => {
    setupStore([]);
    render(<ChatInterface />);
    expect(screen.getByTestId("quick-chip")).toBeTruthy();
  });

  it("quick chip calls sendMessage on click", () => {
    setupStore([]);
    render(<ChatInterface />);
    fireEvent.click(screen.getByTestId("quick-chip"));
    expect(sendMessageMock).toHaveBeenCalledWith("Where's my gate?", []);
  });

  it("shows 'New conversation' button when messages exist", () => {
    setupStore([
      { id: "1", role: "user", content: "Hello", timestamp: new Date().toISOString() },
    ]);
    render(<ChatInterface />);
    expect(screen.getByText(/New conversation/i)).toBeTruthy();
  });

  it("quick chips hidden when messages exist", () => {
    setupStore([
      { id: "1", role: "user", content: "Hello", timestamp: new Date().toISOString() },
    ]);
    render(<ChatInterface />);
    // Quick chips are only shown when messages.length === 0
    expect(screen.queryAllByTestId("quick-chip")).toHaveLength(0);
  });
});
