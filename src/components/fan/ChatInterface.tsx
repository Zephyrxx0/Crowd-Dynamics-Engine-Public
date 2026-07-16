"use client";
import { useState, useRef, useEffect } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatMessage } from "@/components/fan/ChatMessage";
import { ChatInput } from "@/components/fan/ChatInput";
import { QuickChips } from "@/components/fan/QuickChips";
import { RotateCcw, Radio } from "lucide-react";

export function ChatInterface() {
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useLiveStore((s) => s.messages);
  const isStreaming = useLiveStore((s) => s.isStreaming);
  const clearMessages = useLiveStore((s) => s.clearMessages);

  const { sendMessage, cancelStream } = useChatStream();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      cancelStream();
    };
  }, [cancelStream]);

  const handleSend = (text: string) => {
    setHasSentMessage(true);
    sendMessage(text, messages);
  };

  const handleQuickSelect = (question: string) => {
    setHasSentMessage(true);
    sendMessage(question, messages);
  };

  const handleNewConversation = () => {
    clearMessages();
    setHasSentMessage(false);
  };

  const showQuickChips = messages.length === 0 && !hasSentMessage;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-primary/30 bg-primary/10">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-widest text-foreground">Stadium Assistant</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Fan Flow · World Cup 26</p>
          </div>
        </div>

        {messages.length > 0 && !isStreaming && (
          <button
            type="button"
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            New
          </button>
        )}
      </div>

      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
            {/* Dot grid empty state illustration */}
            <div className="relative flex h-24 w-24 items-center justify-center border border-border">
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              />
              <Radio className="h-10 w-10 text-primary relative z-10" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-sm font-semibold uppercase tracking-widest">Welcome to the Stadium Assistant</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ask me about gates, exits, concessions, and crowd levels during the match.
              </p>
            </div>
            {showQuickChips && (
              <QuickChips onSelect={handleQuickSelect} />
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === "assistant" && idx === messages.length - 1;
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={isLastAssistant && isStreaming}
                />
              );
            })}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-4">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
