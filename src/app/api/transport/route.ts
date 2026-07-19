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

function buildFallbackTransportRecommendations(input: z.infer<typeof TransportRequestSchema>) {
  const occupancyValues = Object.values(input.zoneOccupancy);
  const peakOccupancy = occupancyValues.length > 0 ? Math.max(...occupancyValues) : 0;
  const highPressure = peakOccupancy >= 0.85;
  const moderatePressure = peakOccupancy >= 0.7;

  return {
    recommendations: input.routes.map((routeName) => {
      const accessible = /accessible|van|shuttle/i.test(routeName);
      const status = highPressure
        ? accessible
          ? "Surge Active"
          : "Delayed"
        : moderatePressure
          ? "Standby"
          : "On Time";
      const urgency = highPressure ? "high" : moderatePressure ? "medium" : "low";

      return {
        routeName,
        status,
        delayMin: status === "Delayed" ? 12 : null,
        aiReason: highPressure
          ? "Fallback recommendation: peak zone occupancy is high, so transport capacity should be actively managed."
          : moderatePressure
            ? "Fallback recommendation: crowd pressure is building, so keep this route ready for dispatch."
            : "Fallback recommendation: current zone occupancy supports normal route operations.",
        accessible,
        urgency,
      };
    }),
  } satisfies z.infer<typeof TransportResponseSchema>;
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
      return Response.json(buildFallbackTransportRecommendations(parsed.data), {
        status: 200,
        headers: { "X-Transport-Source": "fallback", "X-Transport-Fallback-Reason": "invalid-ai-response" },
      });
    }

    return Response.json(output.data);
  } catch (error) {
    if (error instanceof GeminiFetchError && error.message.includes("Missing GEMINI_API_KEY")) {
      return Response.json(buildFallbackTransportRecommendations(parsed.data), {
        status: 200,
        headers: { "X-Transport-Source": "fallback", "X-Transport-Fallback-Reason": "api-key-not-configured" },
      });
    }
    if (error instanceof GeminiRateLimitError) {
      return Response.json({ error: "Rate limit reached — please try again" }, { status: 429 });
    }
    return Response.json(buildFallbackTransportRecommendations(parsed.data), {
      status: 200,
      headers: { "X-Transport-Source": "fallback", "X-Transport-Fallback-Reason": "ai-generation-failed" },
    });
  }
}
