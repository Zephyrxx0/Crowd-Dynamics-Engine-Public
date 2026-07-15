import { describe, it, expect } from "vitest";
import { applyPhaseTransitionDeltas } from "@/lib/api/phaseTransitions";
import { presets } from "@/simulation/presets";

describe("applyPhaseTransitionDeltas", () => {
  it("deep-clones and does not mutate original input", () => {
    const original = presets.normal;
    const adjusted = applyPhaseTransitionDeltas(original, "halftime");
    
    expect(original.zones[0].capacity).not.toBe(adjusted.zones[0].capacity);
    expect(original.zones[0].capacity).toBe(presets.normal.zones[0].capacity);
  });

  it("applies goal delta to specific zones for arrivals", () => {
    const original = presets.normal;
    const adjusted = applyPhaseTransitionDeltas(original, "goal", [{ zoneId: "north", deltaPercent: 20 }]);
    
    const originalNorth = original.arrivals.filter(a => a.zoneId === "north");
    const adjustedNorth = adjusted.arrivals.filter(a => a.zoneId === "north");
    
    for (let i = 0; i < originalNorth.length; i++) {
      expect(adjustedNorth[i].demandFans).toBe(Math.round(originalNorth[i].demandFans * 1.2));
    }
    
    // South zone should be unchanged
    const originalSouth = original.arrivals.filter(a => a.zoneId === "south");
    const adjustedSouth = adjusted.arrivals.filter(a => a.zoneId === "south");
    expect(adjustedSouth).toEqual(originalSouth);
  });

  it("leaves arrivals unchanged for goal with no zoneDeltas", () => {
    const adjusted = applyPhaseTransitionDeltas(presets.normal, "goal");
    expect(adjusted.arrivals).toEqual(presets.normal.arrivals);
  });

  it("reduces all zone capacities by 10% on halftime", () => {
    const original = presets.normal;
    const adjusted = applyPhaseTransitionDeltas(original, "halftime");
    
    for (let i = 0; i < original.zones.length; i++) {
      expect(adjusted.zones[i].capacity).toBe(Math.round(original.zones[i].capacity * 0.9));
    }
  });

  it("reduces all demandFans by 80% on full-time", () => {
    const original = presets.normal;
    const adjusted = applyPhaseTransitionDeltas(original, "full-time");
    
    for (let i = 0; i < original.arrivals.length; i++) {
      expect(adjusted.arrivals[i].demandFans).toBe(Math.round(original.arrivals[i].demandFans * 0.2));
    }
  });

  it("leaves input unchanged on kickoff", () => {
    const adjusted = applyPhaseTransitionDeltas(presets.normal, "kickoff");
    expect(adjusted).toEqual(presets.normal);
  });

  it("returns a new object reference even if unchanged", () => {
    const adjusted = applyPhaseTransitionDeltas(presets.normal, "kickoff");
    expect(adjusted).not.toBe(presets.normal);
  });
});
