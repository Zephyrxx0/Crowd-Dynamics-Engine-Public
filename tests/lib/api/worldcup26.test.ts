import { describe, it, expect } from "vitest";
import {
  WorldCup26GameSchema,
  parseTimeElapsed,
  mapGameToMatchState,
  findLiveMatch,
  findNextUpcoming,
  type WorldCup26Game
} from "@/lib/api/worldcup26";

describe("worldcup26 API utility", () => {
  const createMockGame = (overrides: Partial<WorldCup26Game>): WorldCup26Game => ({
    _id: "1",
    id: "1",
    home_team_id: "h1",
    away_team_id: "a1",
    home_score: "0",
    away_score: "0",
    home_scorers: null,
    away_scorers: null,
    group: "A",
    matchday: "1",
    local_date: "2026-06-11T12:00:00Z",
    persian_date: "1405-03-21",
    stadium_id: "s1",
    finished: "FALSE",
    time_elapsed: "notstarted",
    type: "group",
    home_team_name_en: "Brazil",
    home_team_name_fa: "برزیل",
    away_team_name_en: "Argentina",
    away_team_name_fa: "آرژانتین",
    ...overrides,
  });

  // Test 1
  it('parseTimeElapsed("notstarted") returns phase="pre-match", minute=null', () => {
    expect(parseTimeElapsed("notstarted")).toEqual({ phase: "pre-match", minute: null });
  });

  // Test 2
  it('parseTimeElapsed("45\'") returns phase="first-half", minute=45', () => {
    expect(parseTimeElapsed("45'")).toEqual({ phase: "first-half", minute: 45 });
  });

  // Test 3
  it('parseTimeElapsed("90+3\'") returns phase="second-half", minute=90', () => {
    expect(parseTimeElapsed("90+3'")).toEqual({ phase: "second-half", minute: 90 });
  });

  // Test 4
  it('parseTimeElapsed("HT") returns phase="half-time", minute=45', () => {
    expect(parseTimeElapsed("HT")).toEqual({ phase: "half-time", minute: 45 });
  });

  // Test 5
  it('parseTimeElapsed("FT") returns phase="full-time", minute=90', () => {
    expect(parseTimeElapsed("FT")).toEqual({ phase: "full-time", minute: 90 });
  });

  // Test 6
  it('mapGameToMatchState with live match returns correct LiveMatch', () => {
    const game = createMockGame({
      home_score: "3",
      away_score: "1",
      home_team_name_en: "Brazil",
      away_team_name_en: "Argentina",
      time_elapsed: "67'",
      finished: "FALSE",
    });
    expect(mapGameToMatchState(game)).toEqual({
      score: "3 - 1",
      homeTeam: "Brazil",
      awayTeam: "Argentina",
      phase: "second-half",
      minute: 67,
    });
  });

  // Test 7
  it('mapGameToMatchState with notstarted returns phase="pre-match", minute=null', () => {
    const game = createMockGame({
      time_elapsed: "notstarted",
    });
    const state = mapGameToMatchState(game);
    expect(state.phase).toBe("pre-match");
    expect(state.minute).toBeNull();
  });

  // Test 8
  it('findLiveMatch returns first game where time_elapsed != "notstarted" && finished === "FALSE"', () => {
    const game1 = createMockGame({ time_elapsed: "notstarted", finished: "FALSE" });
    const game2 = createMockGame({ time_elapsed: "FT", finished: "TRUE" });
    const game3 = createMockGame({ time_elapsed: "23'", finished: "FALSE", home_team_name_en: "Germany" });
    const game4 = createMockGame({ time_elapsed: "45'", finished: "FALSE", home_team_name_en: "France" });

    const liveMatch = findLiveMatch([game1, game2, game3, game4]);
    expect(liveMatch?.home_team_name_en).toBe("Germany");
  });

  // Test 9
  it('findLiveMatch returns null when all games are finished or not started', () => {
    const game1 = createMockGame({ time_elapsed: "notstarted", finished: "FALSE" });
    const game2 = createMockGame({ time_elapsed: "FT", finished: "TRUE" });

    expect(findLiveMatch([game1, game2])).toBeNull();
  });

  // Test 10
  it('findNextUpcoming returns the game with the earliest local_date among notstarted games', () => {
    const game1 = createMockGame({ time_elapsed: "notstarted", local_date: "2026-06-12T12:00:00Z", home_team_name_en: "Team A" });
    const game2 = createMockGame({ time_elapsed: "23'", local_date: "2026-06-10T12:00:00Z", home_team_name_en: "Team B" }); // live
    const game3 = createMockGame({ time_elapsed: "notstarted", local_date: "2026-06-11T12:00:00Z", home_team_name_en: "Team C" });

    const nextUpcoming = findNextUpcoming([game1, game2, game3]);
    expect(nextUpcoming?.home_team_name_en).toBe("Team C");
  });

  // Test 11
  it('WorldCup26GameSchema accepts a game with finished="TRUE"', () => {
    const game = createMockGame({ finished: "TRUE" });
    const result = WorldCup26GameSchema.safeParse(game);
    expect(result.success).toBe(true);
  });

  // Test 12
  it('WorldCup26GameSchema rejects a game with finished="true" (lowercase, not in enum)', () => {
    const game = createMockGame({ finished: "true" as any });
    const result = WorldCup26GameSchema.safeParse(game);
    expect(result.success).toBe(false);
  });
});
