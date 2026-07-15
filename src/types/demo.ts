import { z } from "zod";

export const DemoEventSchema = z.object({
  minute: z.number().int().min(0).max(120),
  phase: z.enum(["pre-match", "first-half", "half-time", "second-half", "full-time"]),
  score: z.string(),
  eventType: z.enum(["kickoff", "goal", "halftime", "second-half-start", "full-time"]),
  zoneDeltas: z
    .array(
      z.object({
        zoneId: z.string(),
        deltaPercent: z.number().int(),
      })
    )
    .optional(),
});

export type DemoEvent = z.infer<typeof DemoEventSchema>;
export const DemoEventSequenceSchema = z.array(DemoEventSchema);
