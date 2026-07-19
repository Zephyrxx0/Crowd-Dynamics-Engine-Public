"use client";
import { cn } from "@/lib/utils";
import { liveStore } from "@/stores/liveStore";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { Map } from "lucide-react";
import { StreamingContent } from "./StreamingContent";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 h-5 px-1">
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";
  const mapTarget = message.structuredData?.zoneInfo?.zoneId ?? message.structuredData?.suggestedGate ?? null;

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")} aria-live={isStreaming ? "assertive" : undefined}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground"
        )}
      >
        {message.structuredData ? (
          <StreamingContent text={message.structuredData.text || message.content} structured={message.structuredData} />
        ) : isStreaming && !message.content ? (
          <TypingIndicator />
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words overflow-hidden leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="ml-1 inline-block h-[14px] w-[2px] animate-pulse bg-current opacity-60 align-middle" />
            )}
          </p>
        )}
        {mapTarget && !isUser && (
          <button
            type="button"
            aria-label={`View ${mapTarget} on map`}
            onClick={() => {
              liveStore.getState().setHighlightedZone(mapTarget);
              document.querySelector('[data-testid="stadium-heatmap"]')?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
          >
            <Map className="h-3 w-3" aria-hidden="true" />
            View on map
          </button>
        )}
      </div>
    </div>
  );
}
