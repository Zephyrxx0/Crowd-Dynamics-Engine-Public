import { describe, expect, it, vi, afterEach } from "vitest";

import { collectGeminiJson } from "@/lib/ai/collectGeminiJson";
import { POST } from "@/app/api/report/route";
import { simulationOutputFixture } from "../ui/fixtures/simulationOutput";

vi.mock("@/lib/ai/collectGeminiJson", () => ({
  collectGeminiJson: vi.fn(),
}));

function makeReportRequest() {
  return new Request("http://localhost/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": crypto.randomUUID() },
    body: JSON.stringify({ output: simulationOutputFixture }),
  });
}

const validAiReport = {
  source: "ai",
  generatedAt: "2026-07-19T12:16:31Z",
  overall: {
    riskLevel: "red",
    confidence: 0.9,
    rationale: "Zone-b peaks in phase-2.",
  },
  criticalZones: [
    {
      zoneId: "zone-b",
      phaseId: "phase-2",
      peakOccupancyRatio: 0.97,
      peakSeverity: "red",
      recommendedAction: "Deploy additional stewards.",
    },
  ],
  staffingRecommendations: [
    {
      zoneId: "zone-b",
      phaseId: "phase-2",
      priority: "high",
      action: "Open an overflow lane.",
      expectedImpact: "Reduce queue pressure.",
    },
  ],
  assumptionsLimitations: ["Simulation-only context."],
  evidence: {
    runDeterministicHash: "fixture-hash-01",
    generatedFrom: "simulation-output",
    rowsAnalyzed: 4,
    peakZones: ["zone-b"],
    warnings: [],
  },
  executiveSummary: "Prioritize zone-b.",
};

describe("POST /api/report", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns AI report when Gemini returns schema-valid JSON", async () => {
    vi.mocked(collectGeminiJson).mockResolvedValueOnce(JSON.stringify(validAiReport));

    const response = await POST(makeReportRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("ai");
  });

  it("retries transient malformed Gemini output before using fallback", async () => {
    vi.mocked(collectGeminiJson)
      .mockResolvedValueOnce("{ this is not json")
      .mockResolvedValueOnce(JSON.stringify(validAiReport));

    const response = await POST(makeReportRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("ai");
    expect(collectGeminiJson).toHaveBeenCalledTimes(2);
  });

  it("returns deterministic fallback instead of 502 when Gemini returns malformed JSON", async () => {
    vi.mocked(collectGeminiJson).mockResolvedValueOnce("{ this is not json");

    const response = await POST(makeReportRequest() as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Report-Source")).toBe("fallback");
    expect(response.headers.get("X-Report-Fallback-Reason")).toBe("ai-generation-failed");
    expect(body.source).toBe("fallback");
    expect(body.evidence.runDeterministicHash).toBe("fixture-hash-01");
  });
});
