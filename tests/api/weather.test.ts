import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "@/app/api/weather/route";
import { NextRequest } from "next/server";

describe("GET /api/weather", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const createRequest = () => ({ url: "http://localhost/api/weather" } as NextRequest);

  const validOWMResponse = {
    main: { temp: 22.3, humidity: 65 },
    weather: [{ main: "Clouds", description: "scattered clouds", icon: "03d" }],
    wind: { speed: 3.2 },
    name: "New York",
  };

  it("Test 1: Returns 200 with temperature, conditions, impact on success", async () => {
    vi.stubEnv("OWM_API_KEY", "test-key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => validOWMResponse,
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("temperature");
    expect(data).toHaveProperty("conditions");
    expect(data).toHaveProperty("impact");
    expect(data.temperature).toBe(22);
    expect(data.conditions).toBe("Clouds");
    expect(data.impact).toBe("none"); // 22°C Clear/Clouds → no heat
  });

  it("Test 2: Returns 500 with status='error' when OWM_API_KEY is missing", async () => {
    vi.stubEnv("OWM_API_KEY", "");

    const response = await GET(createRequest());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("OWM_API_KEY not configured");
  });

  it("Test 3: Returns 502 with status='upstream_error' when fetch returns non-200", async () => {
    vi.stubEnv("OWM_API_KEY", "test-key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.status).toBe("upstream_error");
    expect(data.error).toMatch(/Upstream returned 401/);
  });

  it("Test 4: Returns 502 with status='parse_error' when response body doesn't match schema", async () => {
    vi.stubEnv("OWM_API_KEY", "test-key");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bad: "data" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.status).toBe("parse_error");
    expect(data.error).toBe("Invalid upstream data");
    expect(data.issues).toBeDefined();
  });

  it("Test 5: Returns 502 with status='fetch_error' when fetch throws (network error)", async () => {
    vi.stubEnv("OWM_API_KEY", "test-key");
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.status).toBe("fetch_error");
    expect(data.error).toBe("Network failure");
  });

  it("Test 6: Returns 200 with impact='heat' when temp is 36°C in Clear weather", async () => {
    vi.stubEnv("OWM_API_KEY", "test-key");
    const hotResponse = {
      main: { temp: 36, humidity: 45 },
      weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
      wind: { speed: 1.0 },
      name: "New York",
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => hotResponse,
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.impact).toBe("heat");
  });
});
