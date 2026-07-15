import { describe, it, expect } from "vitest";
import {
  determineImpact,
  mapOwmResponse,
  applyWeatherAdjustment,
  getImpactNote,
  type OWMResponse,
} from "@/lib/api/weather";
import type { SimulationInput } from "@/simulation/contracts/input.schema";

// ─── determineImpact ──────────────────────────────────────────────────────────

describe("determineImpact", () => {
  it("Test 1: returns 'storm' for Thunderstorm", () => {
    expect(determineImpact("Thunderstorm", 20)).toBe("storm");
  });

  it("Test 2: returns 'rain' for Rain", () => {
    expect(determineImpact("Rain", 15)).toBe("rain");
  });

  it("Test 3: returns 'rain' for Drizzle", () => {
    expect(determineImpact("Drizzle", 18)).toBe("rain");
  });

  it("Test 4: returns 'heat' for Clear at 35°C", () => {
    expect(determineImpact("Clear", 35)).toBe("heat");
  });

  it("Test 5: returns 'heat' for Clouds at 40°C", () => {
    expect(determineImpact("Clouds", 40)).toBe("heat");
  });

  it("Test 6: returns 'none' for Clear at 20°C (below threshold)", () => {
    expect(determineImpact("Clear", 20)).toBe("none");
  });

  it("Test 7: returns 'none' for Snow", () => {
    expect(determineImpact("Snow", -2)).toBe("none");
  });

  it("Test 8: returns 'none' for Atmosphere (mist/fog)", () => {
    expect(determineImpact("Atmosphere", 10)).toBe("none");
  });
});

// ─── mapOwmResponse ───────────────────────────────────────────────────────────

describe("mapOwmResponse", () => {
  const rainResponse: OWMResponse = {
    main: { temp: 18.7, humidity: 82 },
    weather: [{ main: "Rain", description: "light rain", icon: "10d" }],
    wind: { speed: 5.5 },
    name: "New York",
  };

  it("Test 9: returns correct WeatherData shape for a full rain response", () => {
    const result = mapOwmResponse(rainResponse);
    expect(result.temperature).toBe(19); // Math.round(18.7)
    expect(result.conditions).toBe("Rain");
    expect(result.humidity).toBe(82);
    expect(result.windSpeed).toBe(20); // Math.round(5.5 * 3.6) = Math.round(19.8) = 20
    expect(result.impact).toBe("rain");
  });

  it("Test 10: handles missing wind field (returns windSpeed undefined)", () => {
    const noWindResponse: OWMResponse = {
      main: { temp: 22, humidity: 60 },
      weather: [{ main: "Clear", description: "clear sky", icon: "01d" }],
      name: "New York",
    };
    const result = mapOwmResponse(noWindResponse);
    expect(result.windSpeed).toBeUndefined();
  });
});

// ─── applyWeatherAdjustment ───────────────────────────────────────────────────

const makeBase = (): SimulationInput => ({
  schemaVersion: "2.1",
  mode: "zone",
  phases: [{ id: "arrive", order: 1, durationMin: 60 }],
  zones: [
    { id: "north", capacity: 1000 },
    { id: "south", capacity: 2000 },
  ],
  gates: [
    { id: "g1", zoneId: "north", throughputPerMin: 200, delayMin: 0 },
    { id: "g2", zoneId: "south", throughputPerMin: 400, delayMin: 0 },
  ],
  arrivals: [
    { phaseId: "arrive", zoneId: "north", demandFans: 800 },
    { phaseId: "arrive", zoneId: "south", demandFans: 1600 },
  ],
});

describe("applyWeatherAdjustment", () => {
  it("Test 11: applies 0.85 multiplier to gate throughput for 'rain'", () => {
    const base = makeBase();
    const result = applyWeatherAdjustment(base, "rain");
    expect(result.gates[0].throughputPerMin).toBe(170); // Math.round(200 * 0.85)
    expect(result.gates[1].throughputPerMin).toBe(340); // Math.round(400 * 0.85)
    // Zones unchanged
    expect(result.zones[0].capacity).toBe(1000);
    expect(result.zones[1].capacity).toBe(2000);
  });

  it("Test 12: applies 0.85 multiplier to zone capacity for 'heat'", () => {
    const base = makeBase();
    const result = applyWeatherAdjustment(base, "heat");
    expect(result.zones[0].capacity).toBe(850); // Math.round(1000 * 0.85)
    expect(result.zones[1].capacity).toBe(1700); // Math.round(2000 * 0.85)
    // Gates unchanged
    expect(result.gates[0].throughputPerMin).toBe(200);
    expect(result.gates[1].throughputPerMin).toBe(400);
  });

  it("Test 13: applies 0.75 to both gates and zones for 'storm'", () => {
    const base = makeBase();
    const result = applyWeatherAdjustment(base, "storm");
    expect(result.gates[0].throughputPerMin).toBe(150); // Math.round(200 * 0.75)
    expect(result.gates[1].throughputPerMin).toBe(300); // Math.round(400 * 0.75)
    expect(result.zones[0].capacity).toBe(750); // Math.round(1000 * 0.75)
    expect(result.zones[1].capacity).toBe(1500); // Math.round(2000 * 0.75)
  });

  it("Test 14: returns identical deep copy for 'none' (no changes, does not mutate)", () => {
    const base = makeBase();
    const result = applyWeatherAdjustment(base, "none");
    expect(result).toEqual(base);
    // Confirm it's a different object (deep clone)
    expect(result).not.toBe(base);
    expect(result.zones).not.toBe(base.zones);
    expect(result.gates).not.toBe(base.gates);
  });
});

// ─── getImpactNote ────────────────────────────────────────────────────────────

describe("getImpactNote", () => {
  it("Test 15: returns correct strings for each impact type, null for 'none'", () => {
    expect(getImpactNote("rain")).toBe("Rain: Gate throughput -15%");
    expect(getImpactNote("heat")).toBe("Heat: Zone capacity -15%");
    expect(getImpactNote("storm")).toBe("Storm: Throughput & capacity -25%");
    expect(getImpactNote("none")).toBeNull();
  });
});
