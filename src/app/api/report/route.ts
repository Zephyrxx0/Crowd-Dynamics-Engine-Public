import { NextRequest } from "next/server";
import { z } from "zod";

import { rateLimit } from "@/lib/api/rateLimit";
import { collectGeminiJson } from "@/lib/ai/collectGeminiJson";
import { GeminiFetchError, GeminiRateLimitError } from "@/lib/ai/gemini";
import { RiskReportSchema } from "@/reporting/contracts/riskReport.schema";
import { buildDeterministicRiskReport } from "@/reporting/fallback/buildDeterministicRiskReport";
import { buildGeminiRiskPrompt } from "@/reporting/gemini/buildPrompt";
import { SimulationOutputSchema } from "@/simulation/contracts/output.schema";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ReportRequestSchema = z.object({
  output: SimulationOutputSchema,
});

type ReportFallbackReason =
  | "api-key-not-configured"
  | "ai-generation-failed"
  | "ai-rate-limit"
  | "invalid-ai-response";

function fallbackResponse(output: z.infer<typeof SimulationOutputSchema>, reason: ReportFallbackReason) {
  return Response.json(buildDeterministicRiskReport(output), {
    status: 200,
    headers: {
      "X-Report-Source": "fallback",
      "X-Report-Fallback-Reason": reason,
    },
  });
}

function parseAiReport(rawJson: string) {
  const output = RiskReportSchema.safeParse(JSON.parse(rawJson));
  if (!output.success || output.data.source !== "ai") {
    return null;
  }

  return output.data;
}

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

  const prompt = buildGeminiRiskPrompt(parsed.data.output);
  let fallbackReason: ReportFallbackReason = "ai-generation-failed";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const rawJson = await collectGeminiJson(prompt, request.signal);
      const output = parseAiReport(rawJson);
      if (output) {
        return Response.json(output);
      }
      fallbackReason = "invalid-ai-response";
    } catch (error) {
      if (error instanceof GeminiFetchError && error.message.includes("Missing GEMINI_API_KEY")) {
        return fallbackResponse(parsed.data.output, "api-key-not-configured");
      }
      if (error instanceof GeminiRateLimitError) {
        return fallbackResponse(parsed.data.output, "ai-rate-limit");
      }
      fallbackReason = "ai-generation-failed";
    }
  }

  return fallbackResponse(parsed.data.output, fallbackReason);
}
