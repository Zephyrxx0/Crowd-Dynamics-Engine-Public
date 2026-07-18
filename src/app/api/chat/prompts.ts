import type { MatchState } from "@/types/match";
import type { ChatMessage } from "@/types/chat";

export function buildChatPrompt(
  zones: { id: string; name: string; occupancy: number; capacity: number; occupancyRatio: number }[],
  matchState: MatchState,
  history: ChatMessage[],
  language: string = "English"
): string {
  const instructions = [
    "You are a stadium navigation assistant for the FIFA World Cup 2026.",
    `Respond in ${language}.`,
    "Use ONLY the zone data and match state provided below.",
    "Do NOT guess wait times. If data is unavailable, say so.",
    "Keep answers concise (2-3 sentences max).",
    "When a fan asks about accessible routes, wheelchair access, or mobility assistance, ALWAYS mention the Accessible Van Transfer service and recommend lower-occupancy zones. Mark these suggestions clearly.",
    "Respond ONLY with a valid JSON object. No markdown fences, no commentary.",
    "Required JSON format:",
    '{ "text": "...", "suggestedGate": "C" | null, "walkingTime": "2 min" | null, "zoneInfo": { "zoneId": "north", "name": "North Zone", "occupancyRatio": 0.5 } | null, "isAccessibleRoute": true | false }',
    "",
    "Example good response:",
    '{"text":"Gate C is closest to your seat. Walking time is approximately 2 minutes via the north concourse.","suggestedGate":"C","walkingTime":"2 min","zoneInfo":{"zoneId":"north","name":"North Zone","occupancyRatio":0.5},"isAccessibleRoute":false}',
    "",
    "Example accessible response:",
    '{"text":"For wheelchair access, Gate A (West entrance) is recommended — it has step-free access and lower crowd density. The Accessible Van Transfer service operates from Gate A every 10 minutes.","suggestedGate":"A","walkingTime":"5 min","zoneInfo":{"zoneId":"west","name":"West Zone","occupancyRatio":0.45},"isAccessibleRoute":true}',
  ];

  // Classify zones by severity to help the AI make smarter routing recommendations
  const zoneLines = zones.map((z) => {
    const severity =
      z.occupancyRatio >= 0.85 ? "HIGH RISK" : z.occupancyRatio >= 0.65 ? "MODERATE" : "LOW";
    return `Zone ${z.id} (${z.name}): ${z.occupancy}/${z.capacity} fans (${Math.round(z.occupancyRatio * 100)}% capacity) [${severity}]`;
  });

  const matchContext = [
    "--- MATCH CONTEXT ---",
    `Minute: ${matchState.minute ?? "Pre-match"}`,
    `Phase: ${matchState.phase}`,
    `Score: ${matchState.homeTeam} ${matchState.score} ${matchState.awayTeam}`,
  ].join("\n");

  const zoneData = [
    "--- ZONE DATA (use to recommend least-congested routes) ---",
    ...zoneLines,
  ].join("\n");

  const conversationHistory =
    history.length > 0
      ? [
          "--- CONVERSATION HISTORY (oldest first) ---",
          ...history.map((m) =>
            `${m.role === "user" ? "Fan" : "Assistant"}: ${m.content}`
          ),
        ].join("\n")
      : "";

  const parts = [instructions.join("\n"), "", matchContext, "", zoneData];
  if (conversationHistory) {
    parts.push("", conversationHistory);
  }

  return parts.join("\n");
}
