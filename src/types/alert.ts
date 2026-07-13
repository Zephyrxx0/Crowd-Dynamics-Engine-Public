import { z } from "zod";

export const AlertEventSchema = z.object({
  id: z.string(),
  severity: z.enum(["nominal", "warning", "critical"]),
  message: z.string(),
  timestamp: z.string().datetime(),
  zoneId: z.string().optional(),
  matchMinute: z.number().int().min(0).optional(),
});

export type AlertEvent = z.infer<typeof AlertEventSchema>;
