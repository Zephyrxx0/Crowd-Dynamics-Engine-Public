import { z } from "zod";

export const ChatResponseSchema = z.object({
  text: z.string().min(1),
  suggestedGate: z.string().nullable().optional(),
  walkingTime: z.string().nullable().optional(),
  zoneInfo: z
    .object({
      zoneId: z.string(),
      name: z.string(),
      occupancyRatio: z.number().min(0).max(1),
    })
    .nullable()
    .optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  structuredData: ChatResponseSchema.nullable().optional(),
  timestamp: z.string().datetime(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).max(10).default([]),
  zoneData: z.array(z.object({ zoneId: z.string(), occupancyRatio: z.number() })).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
