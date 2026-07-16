import { z } from "zod";

export const WorldCup26GameSchema = z.object({
  _id: z.string(),
  id: z.string(),
  home_team_id: z.string(),
  away_team_id: z.string(),
  home_score: z.string(),
  away_score: z.string(),
  home_scorers: z.string().nullable(),
  away_scorers: z.string().nullable(),
  group: z.string(),
  matchday: z.string(),
  local_date: z.string(),
  persian_date: z.string(),
  stadium_id: z.string(),
  finished: z.enum(["TRUE", "FALSE"]),
  time_elapsed: z.string(),
  type: z.string(),
  // Present for group-stage matches; absent for knockout matches until teams qualify
  home_team_name_en: z.string().optional(),
  home_team_name_fa: z.string().optional(),
  away_team_name_en: z.string().optional(),
  away_team_name_fa: z.string().optional(),
  // Knockout placeholder labels e.g. "Winner Group A", "Runner-up Group B"
  home_team_label: z.string().optional(),
  away_team_label: z.string().optional(),
});

export const WorldCup26GamesSchema = z.object({
  games: z.array(WorldCup26GameSchema),
});

export type WorldCup26Game = z.infer<typeof WorldCup26GameSchema>;

export type MatchPhase = "pre-match" | "first-half" | "half-time" | "second-half" | "full-time";

export interface LiveMatch {
  score: string;
  phase: MatchPhase;
  minute: number | null;
  homeTeam: string;
  awayTeam: string;
}

export function parseTimeElapsed(timeElapsed: string): { phase: MatchPhase; minute: number | null } {
  if (timeElapsed === "notstarted") {
    return { phase: "pre-match", minute: null };
  }
  if (timeElapsed === "HT") {
    return { phase: "half-time", minute: 45 };
  }
  if (timeElapsed === "FT") {
    return { phase: "full-time", minute: 90 };
  }
  
  const match = timeElapsed.match(/^(\d+)/);
  if (match) {
    const minute = parseInt(match[1], 10);
    if (minute <= 45) {
      return { phase: "first-half", minute };
    } else {
      return { phase: "second-half", minute };
    }
  }

  return { phase: "pre-match", minute: null };
}

export function mapGameToMatchState(game: WorldCup26Game): LiveMatch {
  const { phase, minute } = parseTimeElapsed(game.time_elapsed);
  return {
    score: `${game.home_score} - ${game.away_score}`,
    phase,
    minute,
    homeTeam: game.home_team_name_en ?? game.home_team_label ?? "TBD",
    awayTeam: game.away_team_name_en ?? game.away_team_label ?? "TBD",
  };
}

export function findLiveMatch(games: WorldCup26Game[]): WorldCup26Game | null {
  return games.find((game) => game.time_elapsed !== "notstarted" && game.finished === "FALSE") || null;
}

export function findNextUpcoming(games: WorldCup26Game[]): WorldCup26Game | null {
  const upcoming = games.filter((game) => game.time_elapsed === "notstarted");
  if (upcoming.length === 0) {
    return null;
  }
  
  return upcoming.sort((a, b) => {
    return new Date(a.local_date).getTime() - new Date(b.local_date).getTime();
  })[0];
}
