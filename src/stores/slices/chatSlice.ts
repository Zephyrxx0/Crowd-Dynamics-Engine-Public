import { type StateCreator } from "zustand";
import type { LiveStore } from "../liveStore";
import type { ChatMessage } from "@/types";

export interface ChatSlice {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (message: ChatMessage) => void;
  setStreaming: (isStreaming: boolean) => void;
}

export const createChatSlice: StateCreator<LiveStore, [], [], ChatSlice> = (set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
});
