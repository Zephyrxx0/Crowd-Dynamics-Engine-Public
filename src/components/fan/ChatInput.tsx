"use client";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-row items-center gap-3">
      <label htmlFor="chat-input" className="sr-only">
        Ask about gates, exits, or crowd levels
      </label>
      <input
        id="chat-input"
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ASK ABOUT GATES, EXITS, OR CROWD LEVELS..."
        disabled={disabled}
        aria-describedby="chat-input-hint"
        className={cn(
          "flex-1 border border-border bg-transparent px-4 py-3 text-sm text-foreground",
          "placeholder:text-muted-foreground placeholder:text-xs placeholder:uppercase placeholder:tracking-widest",
          "focus:border-primary focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      <span id="chat-input-hint" className="sr-only">
        Press Enter or the Send button to submit your question
      </span>
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        className={cn(
          "flex h-[46px] w-[46px] shrink-0 items-center justify-center border border-foreground bg-foreground text-background transition-colors",
          "hover:bg-primary hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        )}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
