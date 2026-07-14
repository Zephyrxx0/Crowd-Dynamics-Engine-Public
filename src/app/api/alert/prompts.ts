import { MatchState } from "@/types/match";

export function buildAlertPrompt(
  zones: { id: string; name: string; occupancy: number; capacity: number; occupancyRatio: number }[],
  matchState: MatchState
): string {
  const instructions = [
    "You are a stadium crowd-density analyst.",
    "Your job is to analyze real-time zone occupancy data and match context to generate structured alerts.",
    "Severity thresholds:",
    "- nominal: <60% capacity",
    "- warning: 60-80% capacity",
    "- critical: >80% capacity",
    "If a zone near a critical zone is also dense, flag it as warning. Use your judgment for edge cases.",
    "Respond ONLY with a valid JSON array. Do not include markdown fences, code blocks, or commentary.",
    "If ALL zones are nominal, return an empty array [].",
    "Example format:",
    '[{"zoneId":"north","severity":"warning","message":"North zone at 72% capacity (432/600) — monitor gate inflow"}]',
  ];

  const contextStr = [
    "--- MATCH CONTEXT ---",
    `Minute: ${matchState.minute ?? "Pre-match"}`,
    `Phase: ${matchState.phase}`,
    `Score: ${matchState.homeTeam} ${matchState.score} ${matchState.awayTeam}`,
  ].join("\n");

  const zonesStr = [
    "--- ZONE DATA ---",
    ...zones.map(z => 
      `Zone ${z.id} (${z.name}): ${z.occupancy}/${z.capacity} fans (${Math.round(z.occupancyRatio * 100)}% capacity)`
    )
  ].join("\n");

  return [...instructions, "", contextStr, "", zonesStr].join("\n");
}
