"use client";
import { useCallback, useRef } from "react";
import { useLiveStore } from "@/stores/liveStore";
import type { ChatMessage, ChatResponse } from "@/types/chat";

export function useChatStream() {
  const addMessage = useLiveStore((s) => s.addMessage);
  const updateMessage = useLiveStore((s) => s.updateMessage);
  const setStreaming = useLiveStore((s) => s.setStreaming);
  const match = useLiveStore((s) => s.match);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, history: ChatMessage[]) => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Add user message to store immediately
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);

      // Build URL with match state query params
      const params = new URLSearchParams();
      if (match?.minute != null) params.set("minute", String(match.minute));
      if (match?.phase) params.set("phase", match.phase);
      if (match?.score) params.set("score", match.score);
      if (match?.homeTeam) params.set("homeTeam", match.homeTeam);
      if (match?.awayTeam) params.set("awayTeam", match.awayTeam);
      const url = `/api/chat?${params.toString()}`;

      // Build messages to send (last 10)
      const outgoingMessages = [...history, userMsg].slice(-10);

      setStreaming(true);

      // Add empty assistant placeholder
      const assistantId = crypto.randomUUID();
      let assistantContent = "";
      addMessage({
        id: assistantId,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
      });

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: outgoingMessages }),
          signal: controller.signal,
        });

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice("data: ".length).trim();
                if (!dataStr) continue;
                try {
                  const data = JSON.parse(dataStr);
                  if (data.type === "token" && data.text) {
                    assistantContent += data.text;
                    updateMessage(assistantId, { content: assistantContent });
                  } else if (data.type === "structured" && data.response) {
                    updateMessage(assistantId, { structuredData: data.response });
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Silently handle abort — new message was sent
          return;
        }
        console.error("[useChatStream] Error:", err);
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [addMessage, updateMessage, setStreaming, match]
  );

  const cancelStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, cancelStream };
}
