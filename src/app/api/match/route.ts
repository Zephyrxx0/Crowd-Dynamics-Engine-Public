
import { type NextRequest } from "next/server";
import {
  WorldCup26GamesSchema,
  mapGameToMatchState,
  findLiveMatch,
} from "@/lib/api/worldcup26";

// worldcup26.ir is a free public API — no token required for read access.
// See: https://worldcup26.ir ("No API key required for read access")
export async function GET(_request: NextRequest) {
  try {
    const response = await fetch("https://worldcup26.ir/get/games", {
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
      homeTeam: game.home_team_name_en ?? game.home_team_label ?? "TBD",
      awayTeam: game.away_team_name_en ?? game.away_team_label ?? "TBD",
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
