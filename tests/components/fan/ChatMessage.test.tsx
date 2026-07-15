import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ChatMessage } from "@/components/fan/ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

const makeMsg = (role: "user" | "assistant", content: string): ChatMessageType => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: new Date().toISOString(),
});

describe("ChatMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders user bubble with justify-end class (right-aligned)", () => {
    const { container } = render(
      <ChatMessage message={makeMsg("user", "Where's my gate?")} />
    );
    const wrapper = container.querySelector(".justify-end");
    expect(wrapper).toBeTruthy();
    expect(screen.getByText("Where's my gate?")).toBeTruthy();
  });

  it("renders assistant bubble with justify-start class (left-aligned)", () => {
    const { container } = render(
      <ChatMessage message={makeMsg("assistant", "Gate C is closest.")} />
    );
    const wrapper = container.querySelector(".justify-start");
    expect(wrapper).toBeTruthy();
    expect(screen.getByText("Gate C is closest.")).toBeTruthy();
  });

  it("shows streaming cursor when isStreaming=true", () => {
    const { container } = render(
      <ChatMessage message={makeMsg("assistant", "Typing...")} isStreaming={true} />
    );
    // Cursor is an inline-block element with animate-pulse
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).toBeTruthy();
  });

  it("does not show streaming cursor when isStreaming=false", () => {
    const { container } = render(
      <ChatMessage message={makeMsg("assistant", "Done.")} isStreaming={false} />
    );
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).toBeNull();
  });
});
