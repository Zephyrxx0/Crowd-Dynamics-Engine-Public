"use client";
import { useState, useRef, useEffect } from "react";
import { useLiveStore } from "@/stores/liveStore";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatMessage } from "@/components/fan/ChatMessage";
import { ChatInput } from "@/components/fan/ChatInput";
import { QuickChips } from "@/components/fan/QuickChips";
import { Button } from "@/components/ui/button";
import { MessageSquare, RotateCcw } from "lucide-react";

export function ChatInterface() {
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useLiveStore((s) => s.messages);
  const isStreaming = useLiveStore((s) => s.isStreaming);
  const clearMessages = useLiveStore((s) => s.clearMessages);

  const { sendMessage, cancelStream } = useChatStream();

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup on unmount
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
    <div className="flex h-screen flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Stadium Assistant</h1>
        {messages.length > 0 && !isStreaming && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            New conversation
          </Button>
        )}
      </div>

      {/* Message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Welcome to the Stadium Assistant</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
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
      <div className="border-t px-4 py-4">
        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
