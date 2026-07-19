import { NextRequest } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/api/rateLimit";
import { collectGeminiJson } from "@/lib/ai/collectGeminiJson";
import { GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { RiskReportSchema } from "@/reporting/contracts/riskReport.schema";
import { buildGeminiRiskPrompt } from "@/reporting/gemini/buildPrompt";
import { SimulationOutputSchema } from "@/simulation/contracts/output.schema";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ReportRequestSchema = z.object({
  output: SimulationOutputSchema,
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (!rateLimit(ip, 10, 60000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const rawJson = await collectGeminiJson(buildGeminiRiskPrompt(parsed.data.output), request.signal);
    const output = RiskReportSchema.safeParse(JSON.parse(rawJson));
    if (!output.success) {
      return Response.json(
        { error: "Invalid AI response", details: output.error.flatten() },
        { status: 502 },
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
