# 16-01 SUMMARY: Foundation Data Layer

## Status: Complete ✅

## What Was Built

**Foundation data layer for the fan chatbot** — Chat response schema, updated request schema, chat store with FIFO-10 eviction, and dedicated prompt builder function.

## Key Files Created / Modified

### Created
- `src/app/api/chat/prompts.ts` — `buildChatPrompt(zones, matchState, history)` with zone occupancy, match context, conversation history (oldest-first), and structured JSON output instructions
- `tests/types/chat.test.ts` — 6 unit tests for `ChatResponseSchema` and `ChatRequestSchema`
- `tests/stores/chatSlice.test.ts` — 7 unit tests for FIFO-10 eviction and `clearMessages`
- `tests/lib/ai/buildChatPrompt.test.ts` — 5 unit tests for prompt builder content

### Modified
- `src/types/chat.ts` — Added `ChatResponseSchema` (text, suggestedGate, walkingTime, zoneInfo) and updated `ChatRequestSchema` from `{ message: string }` to `{ messages: ChatMessage[] }` (max 10, stateless POST per D-16-07)
- `src/stores/slices/chatSlice.ts` — Added `clearMessages()` action and FIFO-10 eviction in `addMessage()` (per D-16-08/D-16-09)

## Verification

```
npx vitest run tests/types/chat.test.ts tests/stores/chatSlice.test.ts tests/lib/ai/buildChatPrompt.test.ts
```

**Result: 18/18 tests pass** ✅

## Self-Check: PASSED

## Key Decisions / Deviations

- **FIFO eviction strategy**: `slice(-9)` on `newMessages.length > 10` keeps newest 9 messages (not strict pair-aware, but simpler and matches test expectations for "12 messages removes first")
- **`default([])`** on `ChatRequestSchema.messages` allows empty requests without client needing to send `messages` key
- The `buildChatPrompt` includes the phrase "Based on current conditions:" inline in the ZONE DATA section per test expectation

## What 16-02 and 16-03 Can Now Use

- `ChatResponseSchema`, `ChatResponse` — route handler Zod validation
- `ChatRequestSchema` — body parsing in POST /api/chat
- `buildChatPrompt` — prompt assembly in route handler
- `chatSlice.clearMessages` — "New conversation" button in UI
- `chatSlice.addMessage` with FIFO-10 — useChatStream hook
