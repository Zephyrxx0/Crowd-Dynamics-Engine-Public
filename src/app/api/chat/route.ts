import { NextRequest } from "next/server";
import { streamGeminiResponse, GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { buildChatPrompt } from "@/app/api/chat/prompts";
import { getZoneData, extractMatchState } from "@/lib/api/zoneData";
import type { MatchState } from "@/types/match";
import { ChatRequestSchema, ChatResponseSchema, type ChatResponse } from "@/types/chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseChatResponse(rawJson: string): ChatResponse | null {
  try {
    const parsed = JSON.parse(rawJson);
    const result = ChatResponseSchema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn("[chat] Zod validation failed:", result.error.message);
    return null;
  } catch (e) {
    console.warn("[chat] JSON parse failed:", e);
    return null;
  }
}

import { rateLimit } from "@/lib/api/rateLimit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip, 15, 60000)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  const encoder = new TextEncoder();

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = parsed.data;

  // Basic prompt-injection guard — strip attempts to override system instructions
  const sanitizeUserInput = (text: string): string =>
    text
      .replace(/\bSYSTEM\s*:/gi, "[blocked]")
      .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, "[blocked]")
      .replace(/<\/?[a-z]+[^>]*>/gi, "") // strip HTML tags
      .trim()
      .slice(0, 1000); // hard cap at 1000 chars per message

  const sanitizedMessages = messages.map((m) =>
    m.role === "user" ? { ...m, content: sanitizeUserInput(m.content) } : m
  );

  const matchState = extractMatchState(request.nextUrl.searchParams);
  const language = request.nextUrl.searchParams.get("language") || "English";
  const zoneData = getZoneData();
  const prompt = buildChatPrompt(zoneData, matchState, sanitizedMessages, language);

  const MAX_RETRIES = 1;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        let structured: ChatResponse | null = null;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          let accumulatedJson = "";
          const retryPrompt =
            attempt === 0
              ? prompt
              : prompt +
                '\n\nIMPORTANT: Your previous response was not valid JSON. Respond ONLY with the JSON object, nothing else.';

          for await (const token of streamGeminiResponse(retryPrompt, { signal: request.signal })) {
            accumulatedJson += token;
            send({ type: "token", text: token });
          }

          structured = parseChatResponse(accumulatedJson);
          if (structured) break;

          if (attempt < MAX_RETRIES) {
            console.warn("[chat] Parse failed on attempt", attempt + 1, "— retrying");
          } else {
            // Both attempts failed — emit text-only fallback
            const fallbackText = accumulatedJson
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
            send({
              type: "structured",
              response: { text: fallbackText || "I'm unable to provide a structured response right now.", suggestedGate: null, walkingTime: null, zoneInfo: null },
            });
            send({ type: "complete" });
            return;
          }
        }

        send({ type: "structured", response: structured });
        send({ type: "complete" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[chat] Error:", message);
        if (error instanceof GeminiFetchError && error.message.includes("Missing GEMINI_API_KEY")) {
          send({ type: "error", message: "API key not configured" });
        } else if (error instanceof GeminiRateLimitError) {
          send({ type: "error", message: "Rate limit reached — please try again" });
        } else {
          send({ type: "error", message });
        }
      } finally {
        controller.close();
      }
    },
  });

  request.signal.addEventListener("abort", () => {
    // Abort propagates automatically via request.signal passed to streamGeminiResponse
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

