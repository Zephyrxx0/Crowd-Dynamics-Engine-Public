import { NextRequest } from "next/server";
import { streamGeminiResponse, GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { buildChatPrompt } from "@/app/api/chat/prompts";
import { presets } from "@/simulation/presets";
import { simulateDeterministic } from "@/simulation/core/simulateDeterministic";
import type { MatchState } from "@/types/match";
import { ChatRequestSchema, ChatResponseSchema, type ChatResponse } from "@/types/chat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getZoneData() {
  const input = presets.normal;
  const output = simulateDeterministic(input);
  const zoneCapacities = new Map(input.zones.map((z) => [z.id, z.capacity]));

  return Array.from(
    output.phaseZoneMatrix
      .reduce((acc, row) => {
        if (!acc.has(row.zoneId) || row.occupancyFans > acc.get(row.zoneId)!.occupancy) {
          acc.set(row.zoneId, {
            id: row.zoneId,
            name: row.zoneId,
            occupancy: row.occupancyFans,
            capacity: zoneCapacities.get(row.zoneId) ?? 0,
            occupancyRatio: row.occupancyRatio,
          });
        }
        return acc;
      }, new Map<string, { id: string; name: string; occupancy: number; capacity: number; occupancyRatio: number }>())
      .values()
  );
}

function extractMatchState(searchParams: URLSearchParams): MatchState {
  const minuteParam = searchParams.get("minute");
  return {
    minute: minuteParam ? parseInt(minuteParam, 10) : null,
    phase: (searchParams.get("phase") as MatchState["phase"]) ?? "first-half",
    score: searchParams.get("score") ?? "0-0",
    homeTeam: searchParams.get("homeTeam") ?? "Home",
    awayTeam: searchParams.get("awayTeam") ?? "Away",
  };
}

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

export async function POST(request: NextRequest) {
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
  const matchState = extractMatchState(request.nextUrl.searchParams);
  const zoneData = getZoneData();
  const prompt = buildChatPrompt(zoneData, matchState, messages);

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

