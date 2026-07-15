import { z } from "zod";
import type { WeatherImpact } from "@/stores/slices/weatherSlice";
import { type WeatherData, WeatherDataSchema } from "@/types/weather";
import type { SimulationInput } from "@/simulation/contracts/input.schema";

// OWM raw response schema — only fields we need
export const OWMResponseSchema = z.object({
  main: z.object({
    temp: z.number(),
    humidity: z.number(),
  }),
  weather: z
    .array(
      z.object({
        main: z.string(),
        description: z.string(),
        icon: z.string(),
      })
    )
    .min(1),
  wind: z
    .object({
      speed: z.number(),
    })
    .optional(),
  name: z.string(),
});

export type OWMResponse = z.infer<typeof OWMResponseSchema>;

export const HEAT_THRESHOLD_C = 35;

/**
 * Maps OWM weather[0].main + temperature to a WeatherImpact classification.
 */
export function determineImpact(
  weatherMain: string,
  temperatureC: number
): WeatherImpact {
  if (weatherMain === "Thunderstorm") return "storm";
  if (weatherMain === "Rain" || weatherMain === "Drizzle") return "rain";
  if (
    (weatherMain === "Clear" || weatherMain === "Clouds") &&
    temperatureC >= HEAT_THRESHOLD_C
  ) {
    return "heat";
  }
  return "none";
}

/**
 * Maps a parsed OWM response to the canonical WeatherData type.
 */
export function mapOwmResponse(raw: OWMResponse): WeatherData {
  const impact = determineImpact(raw.weather[0].main, raw.main.temp);
  const weatherData: WeatherData = {
    temperature: Math.round(raw.main.temp),
    conditions: raw.weather[0].main,
    humidity: raw.main.humidity,
    windSpeed: raw.wind ? Math.round(raw.wind.speed * 3.6) : undefined,
    impact,
  };
  // Safety net: validate output against WeatherDataSchema
  const validated = WeatherDataSchema.safeParse(weatherData);
  if (!validated.success) {
    throw new Error("mapOwmResponse produced invalid WeatherData");
  }
  return validated.data;
}

/**
 * Deep-clones base SimulationInput and applies per-impact weather adjustments.
 * Does NOT mutate the original.
 */
export function applyWeatherAdjustment(
  base: SimulationInput,
  impact: WeatherImpact
): SimulationInput {
  const clone: SimulationInput = JSON.parse(JSON.stringify(base));
  if (impact === "rain") {
    clone.gates = clone.gates.map((gate) => ({
      ...gate,
      throughputPerMin: Math.round(gate.throughputPerMin * 0.85),
    }));
  } else if (impact === "heat") {
    clone.zones = clone.zones.map((zone) => ({
      ...zone,
      capacity: Math.round(zone.capacity * 0.85),
    }));
  } else if (impact === "storm") {
    clone.gates = clone.gates.map((gate) => ({
      ...gate,
      throughputPerMin: Math.round(gate.throughputPerMin * 0.75),
    }));
    clone.zones = clone.zones.map((zone) => ({
      ...zone,
      capacity: Math.round(zone.capacity * 0.75),
    }));
  }
  // "none" → no changes
  return clone;
}

/**
 * Returns a human-readable impact note for display in the WeatherCard.
 * Returns null for "none" impact.
 */
export function getImpactNote(impact: WeatherImpact): string | null {
  switch (impact) {
    case "rain":
      return "Rain: Gate throughput -15%";
    case "heat":
      return "Heat: Zone capacity -15%";
    case "storm":
      return "Storm: Throughput & capacity -25%";
    case "none":
      return null;
  }
}
