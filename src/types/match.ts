import { z } from "zod";

export const MatchStateSchema = z.object({
  score: z.string(),
  phase: z.enum(["pre-match", "first-half", "half-time", "second-half", "full-time"]),
  minute: z.number().int().min(0).max(120).nullable(),
  homeTeam: z.string(),
  awayTeam: z.string(),
});

export type MatchState = z.infer<typeof MatchStateSchema>;
