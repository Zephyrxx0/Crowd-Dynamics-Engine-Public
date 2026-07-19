import { NextRequest } from "next/server";
import { z } from "zod";
import { collectGeminiJson } from "@/lib/ai/collectGeminiJson";
import { GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TransportRequestSchema = z.object({
  zoneOccupancy: z.record(z.string(), z.number().min(0)),
  routes: z.array(z.string().min(1)),
});

const TransportRecommendationSchema = z.object({
  routeName: z.string(),
  status: z.enum(["On Time", "Delayed", "Surge Active", "Standby"]),
  delayMin: z.number().nullable(),
  aiReason: z.string(),
  accessible: z.boolean(),
  urgency: z.enum(["low", "medium", "high"]),
});

const TransportResponseSchema = z.object({
  recommendations: z.array(TransportRecommendationSchema),
});

function buildTransportPrompt(input: z.infer<typeof TransportRequestSchema>) {
  return [
    "You are a FIFA World Cup 2026 stadium transport operations analyst.",
    "Return only JSON matching this schema:",
    '{"recommendations":[{"routeName": string, "status": "On Time|Delayed|Surge Active|Standby", "delayMin": number|null, "aiReason": string, "accessible": boolean, "urgency": "low|medium|high"}]}',
    "Use zone occupancy to recommend route status, accessibility support, and urgency.",
    `Transport data: ${JSON.stringify(input).slice(0, 8000)}`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip, 15, 60000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = TransportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const rawJson = await collectGeminiJson(buildTransportPrompt(parsed.data), request.signal);
    const output = TransportResponseSchema.safeParse(JSON.parse(rawJson));
    if (!output.success) {
      return Response.json(
        { error: "Invalid AI response", details: output.error.flatten() },
        { status: 502 }
      );
    }

    return Response.json(output.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (error instanceof GeminiFetchError && error.message.includes("Missing GEMINI_API_KEY")) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }
    if (error instanceof GeminiRateLimitError) {
      return Response.json({ error: "Rate limit reached — please try again" }, { status: 429 });
    }
    return Response.json({ error: message }, { status: 502 });
  }
}
