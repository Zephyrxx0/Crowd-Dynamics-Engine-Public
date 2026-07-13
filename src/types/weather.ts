import { z } from "zod";

export const WeatherDataSchema = z.object({
  temperature: z.number(),
  conditions: z.string(),
  humidity: z.number().min(0).max(100).optional(),
  windSpeed: z.number().min(0).optional(),
  impact: z.enum(["none", "rain", "heat", "storm"]),
});

export type WeatherData = z.infer<typeof WeatherDataSchema>;
