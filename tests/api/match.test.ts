import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "@/app/api/match/route";
import { NextRequest } from "next/server";
import { type WorldCup26Game } from "@/lib/api/worldcup26";

describe("GET /api/match", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const createRequest = () => ({ url: "http://localhost/api/match" } as NextRequest);

  const mockGames: { games: Partial<WorldCup26Game>[] } = {
    games: [
      {
        _id: "1",
        id: "1",
        home_team_id: "h1",
        away_team_id: "a1",
        home_score: "3",
        away_score: "1",
        home_scorers: null,
        away_scorers: null,
        group: "A",
        matchday: "1",
        local_date: "2026-06-11T12:00:00Z",
        persian_date: "1405-03-21",
        stadium_id: "s1",
        finished: "FALSE",
        time_elapsed: "67'",
        type: "group",
        home_team_name_en: "Brazil",
        home_team_name_fa: "برزیل",
        away_team_name_en: "Argentina",
        away_team_name_fa: "آرژانتین",
      },
      {
        _id: "2",
        id: "2",
        home_team_id: "h2",
        away_team_id: "a2",
        home_score: "0",
        away_score: "0",
        home_scorers: null,
        away_scorers: null,
        group: "A",
        matchday: "1",
        local_date: "2026-06-12T12:00:00Z",
        persian_date: "1405-03-22",
        stadium_id: "s2",
        finished: "FALSE",
        time_elapsed: "notstarted",
        type: "group",
        home_team_name_en: "Germany",
        home_team_name_fa: "",
        away_team_name_en: "France",
        away_team_name_fa: "",
      },
      {
        _id: "3",
        id: "3",
        home_team_id: "h3",
        away_team_id: "a3",
        home_score: "2",
        away_score: "0",
        home_scorers: null,
        away_scorers: null,
        group: "B",
        matchday: "1",
        local_date: "2026-06-10T12:00:00Z",
        persian_date: "1405-03-20",
        stadium_id: "s3",
        finished: "TRUE",
        time_elapsed: "FT",
        type: "group",
        home_team_name_en: "Spain",
        home_team_name_fa: "",
        away_team_name_en: "Italy",
        away_team_name_fa: "",
      }
    ]
  };

  it("Test 1: Returns { match: LiveMatch, allGames: [...] } with correct shape on success", async () => {
    vi.stubEnv("WORLDCUP26_TOKEN", "test-token-123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGames,
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.match).toBeDefined();
    expect(data.match.homeTeam).toBe("Brazil");
    expect(data.match.score).toBe("3 - 1");
    expect(data.allGames).toBeDefined();
    expect(data.allGames.length).toBe(3);
    expect(data.allGames[0].homeTeam).toBe("Brazil");
    expect(data.allGames[0].score).toBe("3 - 1");
    expect(mockFetch).toHaveBeenCalledWith("https://worldcup26.ir/get/games", expect.objectContaining({
      headers: { Authorization: "Bearer test-token-123" }
    }));
  });

  it("Test 2: Returns 500 { error, status: 'error' } when WORLDCUP26_TOKEN is empty/missing", async () => {
    vi.stubEnv("WORLDCUP26_TOKEN", "");
    const response = await GET(createRequest());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("WORLDCUP26_TOKEN not configured");
  });

  it("Test 3: Returns 502 { error, status: 'upstream_error' } when fetch returns non-200", async () => {
    vi.stubEnv("WORLDCUP26_TOKEN", "test-token-123");
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.status).toBe("upstream_error");
    expect(data.error).toMatch(/Upstream returned 403/);
  });

  it("Test 4: Returns 502 { error, status: 'parse_error' } when response body doesn't match schema", async () => {
    vi.stubEnv("WORLDCUP26_TOKEN", "test-token-123");
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

  it("Test 5: Returns 502 { error, status: 'fetch_error' } when fetch throws (network error)", async () => {
    vi.stubEnv("WORLDCUP26_TOKEN", "test-token-123");
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.status).toBe("fetch_error");
    expect(data.error).toBe("Network failure");
  });

  it("Test 6: Returns match: null + allGames populated when no live match found", async () => {
    vi.stubEnv("WORLDCUP26_TOKEN", "test-token-123");
    const noLiveGames = {
      games: [
        mockGames.games[1], // notstarted
        mockGames.games[2], // FT
      ]
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => noLiveGames,
    });
    vi.stubGlobal("fetch", mockFetch);

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.match).toBeNull();
    expect(data.allGames.length).toBe(2);
  });
});
