import { NextRequest } from "next/server";
import { streamGeminiResponse, validateAlertOutput, GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { buildAlertPrompt } from "@/app/api/alert/prompts";
import { presets } from "@/simulation/presets";
import { simulateDeterministic } from "@/simulation/core/simulateDeterministic";
import { MatchState } from "@/types/match";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getZoneData() {
  const input = presets.normal;
  const output = simulateDeterministic(input);
  const zoneCapacities = new Map(input.zones.map(z => [z.id, z.capacity]));
  
  return Array.from(
    output.phaseZoneMatrix.reduce((acc, row) => {
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

export async function GET(request: NextRequest) {
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
