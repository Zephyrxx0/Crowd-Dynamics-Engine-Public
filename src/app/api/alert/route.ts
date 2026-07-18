import { NextRequest } from "next/server";
import { streamGeminiResponse, validateAlertOutput, GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { buildAlertPrompt } from "@/app/api/alert/prompts";
import { getZoneData, extractMatchState } from "@/lib/api/zoneData";
import { MatchState } from "@/types/match";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { rateLimit } from "@/lib/api/rateLimit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip, 30, 60000)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  const encoder = new TextEncoder();
  const matchState = extractMatchState(request.nextUrl.searchParams);
  const zoneData = getZoneData();
  const prompt = buildAlertPrompt(zoneData, matchState);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let accumulatedJson = "";
        for await (const token of streamGeminiResponse(prompt, { signal: request.signal })) {
          accumulatedJson += token;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "token", text: token })}\n\n`)
          );
        }
        
        const alerts = validateAlertOutput(accumulatedJson);
        for (const alert of alerts) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "alert", alert })}\n\n`)
          );
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[alert] Error:", message);
        if (error instanceof GeminiFetchError && error.message.includes("Missing GEMINI_API_KEY")) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "API key not configured" })}\n\n`
          ));
        } else if (error instanceof GeminiRateLimitError) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Rate limit reached — will retry next cycle" })}\n\n`
          ));
        } else {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          ));
        }
      } finally {
        controller.close();
      }
    },
  });

  request.signal.addEventListener("abort", () => {
    // Abort logic propagates automatically via request.signal
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
