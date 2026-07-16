"use client";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground"
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
          {isStreaming && (
            <span className="ml-1 inline-block h-[14px] w-[2px] animate-pulse bg-current opacity-60 align-middle" />
          )}
        </p>
      </div>
    </div>
  );
}
