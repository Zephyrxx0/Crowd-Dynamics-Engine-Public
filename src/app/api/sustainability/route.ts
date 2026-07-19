import { NextRequest } from "next/server";
import { z } from "zod";
import { collectGeminiJson } from "@/lib/ai/collectGeminiJson";
import { GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/api/rateLimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SustainabilityRequestSchema = z.object({
  zoneMatrix: z.array(z.record(z.string(), z.unknown())).optional(),
  phaseData: z.array(z.record(z.string(), z.unknown())).optional(),
});

const SustainabilityResponseSchema = z.object({
  co2KgTotal: z.number().nonnegative(),
  greenScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  transportTips: z.array(z.string()),
});

function buildSustainabilityPrompt(input: z.infer<typeof SustainabilityRequestSchema>) {
  return [
    "You are a FIFA World Cup 2026 stadium sustainability analyst.",
    "Return only JSON matching this schema:",
    '{"co2KgTotal": number, "greenScore": number, "recommendations": string[], "transportTips": string[]}',
    "Estimate carbon impact, green transport opportunities, and operational sustainability KPIs.",
    `Crowd data: ${JSON.stringify(input)}`,
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

  const parsed = SustainabilityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const rawJson = await collectGeminiJson(buildSustainabilityPrompt(parsed.data), request.signal);
    const output = SustainabilityResponseSchema.safeParse(JSON.parse(rawJson));
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
