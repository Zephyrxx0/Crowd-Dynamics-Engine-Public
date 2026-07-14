
import { type NextRequest } from "next/server";
import {
  WorldCup26GamesSchema,
  mapGameToMatchState,
  findLiveMatch,
} from "@/lib/api/worldcup26";

export async function GET(_request: NextRequest) {
  const token = process.env.WORLDCUP26_TOKEN;
  if (!token) {
    return Response.json(
      { error: "WORLDCUP26_TOKEN not configured", status: "error" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://worldcup26.ir/get/games", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return Response.json(
        { error: `Upstream returned ${response.status}`, status: "upstream_error" },
        { status: 502 }
      );
    }

    const raw = (await response.json()) as unknown;
    const parsed = WorldCup26GamesSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid upstream data",
          status: "parse_error",
          issues: parsed.error.issues,
        },
        { status: 502 }
      );
    }

    const games = parsed.data.games;
    const liveMatchGame = findLiveMatch(games);
    const match = liveMatchGame ? mapGameToMatchState(liveMatchGame) : null;

    const allGames = games.map((game) => ({
      homeTeam: game.home_team_name_en,
      awayTeam: game.away_team_name_en,
      localDate: game.local_date,
      timeElapsed: game.time_elapsed,
      finished: game.finished,
      score: `${game.home_score} - ${game.away_score}`,
    }));

    return Response.json({ match, allGames });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Network failure", status: "fetch_error" },
      { status: 502 }
    );
  }
}
