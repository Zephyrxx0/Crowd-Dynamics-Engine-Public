"use client";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
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
          <StreamingContent text={message.structuredData.text || message.content} structured={message.structuredData as any} />
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
      </div>
    </div>
  );
}
