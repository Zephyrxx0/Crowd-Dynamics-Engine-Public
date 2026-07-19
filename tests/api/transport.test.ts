import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/transport/route";
import { collectGeminiJson } from "@/lib/ai/collectGeminiJson";

vi.mock("@/lib/ai/collectGeminiJson", () => ({
  collectGeminiJson: vi.fn(),
}));

function makeTransportRequest(body: unknown) {
  return new Request("http://localhost/api/transport", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
}

const transportRequestBody = {
  zoneOccupancy: {
    north: 0.92,
    south: 0.61,
  },
  routes: ["Metro Line A", "Accessible Van Transfer"],
};

describe("POST /api/transport", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns AI recommendations when Gemini returns schema-valid JSON", async () => {
    vi.mocked(collectGeminiJson).mockResolvedValueOnce(
      JSON.stringify({
        recommendations: [
          {
            routeName: "Metro Line A",
            status: "Delayed",
            delayMin: 8,
            aiReason: "North gate pressure is high.",
            accessible: false,
            urgency: "high",
          },
          {
            routeName: "Accessible Van Transfer",
            status: "Surge Active",
            delayMin: null,
            aiReason: "Accessible support should be staged near the busiest zones.",
            accessible: true,
            urgency: "high",
          },
        ],
      }),
    );

    const response = await POST(makeTransportRequest(transportRequestBody) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Transport-Source")).toBeNull();
    expect(body.recommendations).toHaveLength(2);
    expect(body.recommendations[0]).toMatchObject({
      routeName: "Metro Line A",
      status: "Delayed",
      urgency: "high",
    });
  });

  it("returns deterministic fallback instead of 502 when Gemini returns malformed JSON", async () => {
    vi.mocked(collectGeminiJson).mockResolvedValueOnce("{ not valid json");

    const response = await POST(makeTransportRequest(transportRequestBody) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Transport-Source")).toBe("fallback");
    expect(response.headers.get("X-Transport-Fallback-Reason")).toBe("ai-generation-failed");
    expect(body.recommendations).toEqual([
      expect.objectContaining({
        routeName: "Metro Line A",
        status: "Delayed",
        urgency: "high",
      }),
      expect.objectContaining({
        routeName: "Accessible Van Transfer",
        status: "Surge Active",
        urgency: "high",
        accessible: true,
      }),
    ]);
  });

  it("returns deterministic fallback instead of 502 when Gemini returns the wrong schema", async () => {
    vi.mocked(collectGeminiJson).mockResolvedValueOnce(
      JSON.stringify({ recommendations: [{ routeName: "Metro Line A", status: "Blocked" }] }),
    );

    const response = await POST(makeTransportRequest(transportRequestBody) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Transport-Fallback-Reason")).toBe("invalid-ai-response");
    expect(body.recommendations[0]).toMatchObject({
      routeName: "Metro Line A",
      status: "Delayed",
      urgency: "high",
    });
  });
});
